import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { 
    Search, 
    Upload, 
    UserPlus, 
    ChevronLeft, 
    ChevronRight,
    ChevronDown,
    Trash2,
    Award
} from 'react-feather';
import { useEmployees, useEmployeeWithSkills, useDeleteEmployee } from '../constants/SkillQueries';
import type { EmployeeID } from '../constants/SkillTypes';
import AddEmployeeModal from '../components/AddEmployeeModal';
import ResumeUploadModal from '../components/ResumeUploadModal';

export default function EmployeesPage() {
    // Filters
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    
    // Expanded row for skills
    const [expandedId, setExpandedId] = useState<EmployeeID | null>(null);
    
    // Data
    const { data: employees = [], isLoading, refetch } = useEmployees();
    const { data: expandedEmployee } = useEmployeeWithSkills({ id: expandedId ?? undefined });
    const deleteEmployee = useDeleteEmployee();
    
    // Get unique departments
    const departments = useMemo(() => 
        Array.from(new Set(employees.map(e => e.department))).sort(),
        [employees]
    );
    
    // Filter employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = !search || 
                emp.name.toLowerCase().includes(search.toLowerCase()) ||
                emp.role.toLowerCase().includes(search.toLowerCase()) ||
                emp.email.toLowerCase().includes(search.toLowerCase());
            const matchesDept = !selectedDept || emp.department === selectedDept;
            return matchesSearch && matchesDept;
        });
    }, [employees, search, selectedDept]);
    
    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / pageSize);
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredEmployees.slice(start, start + pageSize);
    }, [filteredEmployees, currentPage, pageSize]);
    
    // Reset to page 1 when filters change
    const handleFilterChange = (newSearch: string, newDept: string) => {
        setSearch(newSearch);
        setSelectedDept(newDept);
        setCurrentPage(1);
    };

    const handleSuccess = () => {
        refetch();
    };

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation(); // Prevent row expand
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await deleteEmployee.mutateAsync(id);
            } catch (error) {
                alert('Failed to delete employee');
                console.error(error);
            }
        }
    };
    
    return (
        <>
            <Head>
                <title>Employees | HR Platform</title>
            </Head>
            
            <div className="min-h-screen bg-slate-50 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
                            <p className="text-slate-600">
                                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResumeModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <Upload size={18} />
                                Upload Resume
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <UserPlus size={18} />
                                Add Employee
                            </button>
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="flex-1 max-w-md relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, role, or email..."
                                value={search}
                                onChange={(e) => handleFilterChange(e.target.value, selectedDept)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedDept}
                            onChange={(e) => handleFilterChange(search, e.target.value)}
                            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[180px]"
                        >
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Department</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Email</th>
                                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : paginatedEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmployees.map((emp) => (
                                    <React.Fragment key={emp.id}>
                                        <tr 
                                            className={`
                                                border-b border-slate-100 hover:bg-slate-50 cursor-pointer
                                                ${expandedId === emp.id ? 'bg-indigo-50' : ''}
                                            `}
                                            onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span className="font-medium text-slate-900">{emp.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{emp.role}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                                    {emp.department}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={(e) => handleDelete(e, emp.id, emp.name)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete employee"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
                                                        <ChevronDown 
                                                            size={16} 
                                                            className={`transition-transform ${expandedId === emp.id ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded skills row */}
                                        {expandedId === emp.id && expandedEmployee?.skills && (
                                            <tr className="bg-indigo-50/50">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {expandedEmployee.skills.length === 0 ? (
                                                            <span className="text-slate-500 text-sm">No skills listed</span>
                                                        ) : (
                                                            expandedEmployee.skills.map(({ skill, proficiency, certified }) => (
                                                                <div 
                                                                    key={skill.id}
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                                                                >
                                                                    <span className="text-sm font-medium text-slate-700">
                                                                        {skill.name}
                                                                    </span>
                                                                    <div className="flex gap-0.5">
                                                                        {[1, 2, 3, 4, 5].map(n => (
                                                                            <div 
                                                                                key={n}
                                                                                className={`w-2 h-2 rounded-full ${
                                                                                    n <= proficiency ? 'bg-indigo-500' : 'bg-slate-200'
                                                                                }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                    {certified && (
                                                                        <span className="text-emerald-600 text-xs">✓</span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {filteredEmployees.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>Show</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 border border-slate-200 rounded bg-white"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>per page</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Modals */}
            <AddEmployeeModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleSuccess}
            />
            <ResumeUploadModal
                isOpen={showResumeModal}
                onClose={() => setShowResumeModal(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
}
