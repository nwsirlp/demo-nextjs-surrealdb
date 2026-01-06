import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEmployees, useSkills } from '../constants/SkillQueries';
import { SurrealInstance as surreal } from '../lib/Surreal';
import { RefreshCw, ZoomIn, ZoomOut, Maximize2, Play, Pause } from 'react-feather';

// Types for graph data
interface GraphNode {
    id: string;
    label: string;
    type: 'employee' | 'skill';
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
    data?: Record<string, unknown>;
}

interface GraphEdge {
    source: string;
    target: string;
    label?: string;
    proficiency?: number;
}

interface HasSkillEdge {
    in: string;
    out: string;
    proficiency: number;
}

export default function KnowledgeGraph() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<GraphNode[]>([]);
    const edgesRef = useRef<GraphEdge[]>([]);
    const animationRef = useRef<number | null>(null);
    const isSimulatingRef = useRef(true);
    
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(true);
    const [, forceRender] = useState(0);
    
    const { data: employees = [] } = useEmployees();
    const { data: skills = [] } = useSkills();
    
    // Render function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const nodes = nodesRef.current;
        const edges = edgesRef.current;
        
        // Clear canvas with dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply zoom and pan
        ctx.save();
        ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Draw edges with glow effect
        for (const edge of edges) {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (source && target) {
                // Edge line
                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + (edge.proficiency || 3) * 0.05})`;
                ctx.lineWidth = 1 + (edge.proficiency || 3) * 0.3;
                ctx.stroke();
                
                // Proficiency label at midpoint
                if (edge.proficiency) {
                    const midX = (source.x + target.x) / 2;
                    const midY = (source.y + target.y) / 2;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.font = 'bold 10px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(String(edge.proficiency), midX, midY);
                }
            }
        }
        
        // Draw nodes
        for (const node of nodes) {
            const isSelected = selectedNode?.id === node.id;
            
            // Glow effect for selected node
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.fill();
            }
            
            // Node shadow
            ctx.beginPath();
            ctx.arc(node.x + 2, node.y + 2, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            
            // Node circle with gradient
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                node.x - node.radius * 0.3, 
                node.y - node.radius * 0.3, 
                0,
                node.x, 
                node.y, 
                node.radius
            );
            
            if (node.type === 'employee') {
                gradient.addColorStop(0, '#818cf8');
                gradient.addColorStop(1, '#4f46e5');
            } else {
                gradient.addColorStop(0, '#34d399');
                gradient.addColorStop(1, '#10b981');
            }
            
            ctx.fillStyle = isSelected ? '#fbbf24' : gradient;
            ctx.fill();
            
            // Node border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Node label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const maxLen = node.type === 'employee' ? 10 : 8;
            const label = node.label.length > maxLen 
                ? node.label.substring(0, maxLen) + '..' 
                : node.label;
            ctx.fillText(label, node.x, node.y);
        }
        
        ctx.restore();
        
        // Draw legend (outside transform)
        ctx.font = 'bold 12px Inter, sans-serif';
        
        // Employees legend
        ctx.beginPath();
        ctx.arc(30, 30, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Employees', 45, 30);
        
        // Skills legend
        ctx.beginPath();
        ctx.arc(30, 55, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Skills', 45, 55);
        
    }, [zoom, pan, selectedNode]);
    
    // Force simulation step
    const simulateStep = useCallback(() => {
        const nodes = nodesRef.current;
        const edges = edgesRef.current;
        
        if (nodes.length === 0) return;
        
        const canvas = canvasRef.current;
        const width = canvas?.width || 800;
        const height = canvas?.height || 600;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Apply forces to each node
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            // Skip dragged node
            if (node.id === draggingNode) continue;
            
            let fx = 0, fy = 0;
            
            // Center gravity (weak pull to center)
            fx += (centerX - node.x) * 0.0005;
            fy += (centerY - node.y) * 0.0005;
            
            // Repulsion from all other nodes
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;
                const other = nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq) || 1;
                
                // Stronger repulsion for same type
                const repulsionStrength = node.type === other.type ? 2500 : 1500;
                const force = repulsionStrength / distSq;
                
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
            }
            
            // Attraction along edges
            for (const edge of edges) {
                if (edge.source === node.id || edge.target === node.id) {
                    const otherId = edge.source === node.id ? edge.target : edge.source;
                    const other = nodes.find(n => n.id === otherId);
                    if (other) {
                        const dx = other.x - node.x;
                        const dy = other.y - node.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        // Target distance based on proficiency (higher = closer)
                        const targetDist = 120 - (edge.proficiency || 3) * 10;
                        const force = (dist - targetDist) * 0.02;
                        
                        fx += (dx / dist) * force;
                        fy += (dy / dist) * force;
                    }
                }
            }
            
            // Update velocity with forces
            node.vx = (node.vx + fx) * 0.85; // Damping
            node.vy = (node.vy + fy) * 0.85;
            
            // Clamp velocity
            const maxVel = 5;
            const vel = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (vel > maxVel) {
                node.vx = (node.vx / vel) * maxVel;
                node.vy = (node.vy / vel) * maxVel;
            }
            
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Keep in bounds with soft bounce
            const margin = 40;
            if (node.x < margin) { node.x = margin; node.vx *= -0.5; }
            if (node.x > width - margin) { node.x = width - margin; node.vx *= -0.5; }
            if (node.y < margin) { node.y = margin; node.vy *= -0.5; }
            if (node.y > height - margin) { node.y = height - margin; node.vy *= -0.5; }
        }
    }, [draggingNode]);
    
    // Animation loop
    useEffect(() => {
        let lastTime = 0;
        
        const animate = (time: number) => {
            // Target 60 FPS
            if (time - lastTime >= 16) {
                if (isSimulatingRef.current) {
                    simulateStep();
                }
                render();
                lastTime = time;
            }
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [simulateStep, render]);
    
    // Fetch graph data
    useEffect(() => {
        async function fetchEdges() {
            try {
                const result = await surreal.query<[HasSkillEdge[]]>('SELECT in, out, proficiency FROM has_skill');
                
                let edgeData: HasSkillEdge[] = [];
                if (Array.isArray(result) && result.length > 0) {
                    const data = result[0];
                    if (Array.isArray(data)) {
                        edgeData = data;
                    }
                }
                
                edgesRef.current = edgeData.map(e => ({
                    source: String(e.in),
                    target: String(e.out),
                    proficiency: e.proficiency,
                }));
                
                forceRender(n => n + 1);
            } catch (error) {
                console.error('Failed to fetch edges:', error);
            } finally {
                setLoading(false);
            }
        }
        
        if (employees.length > 0 && skills.length > 0) {
            fetchEdges();
        }
    }, [employees, skills]);
    
    // Create nodes from employees and skills
    useEffect(() => {
        if (employees.length === 0 && skills.length === 0) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const graphNodes: GraphNode[] = [];
        
        // Add employee nodes scattered around left side
        employees.forEach((emp, i) => {
            const angle = (i / employees.length) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 100 + Math.random() * 80;
            graphNodes.push({
                id: String(emp.id),
                label: emp.name,
                type: 'employee',
                x: centerX - 100 + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: '#4f46e5',
                radius: 28,
                data: { role: emp.role, department: emp.department },
            });
        });
        
        // Add skill nodes scattered around right side
        skills.forEach((skill, i) => {
            const angle = (i / skills.length) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 120 + Math.random() * 100;
            graphNodes.push({
                id: String(skill.id),
                label: skill.name,
                type: 'skill',
                x: centerX + 100 + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: '#10b981',
                radius: 22,
                data: { category: skill.category },
            });
        });
        
        nodesRef.current = graphNodes;
        forceRender(n => n + 1);
    }, [employees, skills]);
    
    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        
        // Transform to world coordinates
        const worldX = (canvasX - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
        const worldY = (canvasY - pan.y - canvas.height / 2) / zoom + canvas.height / 2;
        
        // Check if clicked on a node
        for (const node of nodesRef.current) {
            const dx = worldX - node.x;
            const dy = worldY - node.y;
            if (dx * dx + dy * dy < node.radius * node.radius) {
                setSelectedNode(node);
                setDraggingNode(node.id);
                return;
            }
        }
        
        setSelectedNode(null);
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingNode) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        
        const worldX = (canvasX - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
        const worldY = (canvasY - pan.y - canvas.height / 2) / zoom + canvas.height / 2;
        
        const node = nodesRef.current.find(n => n.id === draggingNode);
        if (node) {
            node.x = worldX;
            node.y = worldY;
            node.vx = 0;
            node.vy = 0;
        }
    };
    
    const handleMouseUp = () => {
        setDraggingNode(null);
    };
    
    const toggleSimulation = () => {
        isSimulatingRef.current = !isSimulatingRef.current;
        setIsSimulating(isSimulatingRef.current);
    };
    
    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] bg-slate-900 rounded-xl">
                <div className="text-white flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={20} />
                    Loading knowledge graph...
                </div>
            </div>
        );
    }
    
    return (
        <div className="relative bg-slate-900 rounded-xl overflow-hidden">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full cursor-grab active:cursor-grabbing"
                style={{ display: 'block' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                    onClick={toggleSimulation}
                    className={`p-2 rounded-lg text-white transition-colors ${
                        isSimulating 
                            ? 'bg-green-500/20 hover:bg-green-500/30' 
                            : 'bg-red-500/20 hover:bg-red-500/30'
                    }`}
                    title={isSimulating ? 'Pause Simulation' : 'Resume Simulation'}
                >
                    {isSimulating ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                    onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={18} />
                </button>
                <button
                    onClick={resetView}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-white transition-colors"
                    title="Reset View"
                >
                    <Maximize2 size={18} />
                </button>
            </div>
            
            {/* Selected node info */}
            {selectedNode && (
                <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur text-white p-4 rounded-xl shadow-xl max-w-xs border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedNode.type === 'employee' ? '#4f46e5' : '#10b981' }}
                        />
                        <h3 className="font-bold text-lg">{selectedNode.label}</h3>
                    </div>
                    <p className="text-sm text-slate-400 capitalize mb-2">{selectedNode.type}</p>
                    {selectedNode.data && (
                        <div className="space-y-1 text-sm border-t border-slate-700 pt-2">
                            {Object.entries(selectedNode.data).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-4">
                                    <span className="text-slate-400 capitalize">{key}:</span>
                                    <span className="text-right">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                        {edgesRef.current.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} connections
                    </p>
                </div>
            )}
            
            {/* Stats */}
            <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur text-white px-3 py-2 rounded-lg text-sm border border-slate-700">
                <span className="text-slate-400">Nodes:</span> {nodesRef.current.length} &nbsp;|&nbsp;
                <span className="text-slate-400">Edges:</span> {edgesRef.current.length}
            </div>
        </div>
    );
}
