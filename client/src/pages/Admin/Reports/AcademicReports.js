import React from "react";
import { Hammer } from "lucide-react";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs"; 

export default function AcademicReports() {
    // Path: Admin > Academics > Reports > Academic Reports
    const currentPath = ['Admin', 'Academics', 'Reports', 'Academic Reports'];

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* 'Reports' is removed from nonLinkSegments to make it clickable */}
            <Breadcrumbs 
                path={currentPath} 
                nonLinkSegments={['Admin', 'Academics']} 
            />

            <div style={{
                marginTop: '100px',
                textAlign: 'center',
                color: '#6c757d'
            }}>
                <Hammer size={48} style={{ marginBottom: '15px', color: '#007bff' }} />
                <h2 style={{ color: '#333' }}>Academic Reports</h2>
                <p>This module is currently <strong>Under Development</strong></p>
                
                <button 
                    onClick={() => window.history.back()}
                    style={{
                        marginTop: '20px',
                        background: 'none',
                        border: '1px solid #007bff',
                        color: '#007bff',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    ← Go Back
                </button>
            </div>
        </div>
    );
}