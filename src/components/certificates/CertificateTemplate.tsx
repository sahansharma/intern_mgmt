import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Building2 } from 'lucide-react';

interface CertificateData {
  certificate_name: string;
  intern_name: string;
  completion_date: string;
  skills_acquired: string[];
  performance_rating?: number;
  supervisor_name?: string;
}

interface CertificateTemplateProps {
  data: CertificateData;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data }, ref) => {
    const formattedDate = data.completion_date ? format(new Date(data.completion_date), 'MMMM dd, yyyy') : '';
    
    return (
      <div
        ref={ref}
        className="w-[800px] h-[600px] mx-auto relative overflow-hidden"
        style={{
          fontFamily: 'Georgia, serif',
          background: 'linear-gradient(135deg, hsl(var(--ntc-white)) 0%, hsl(var(--ntc-gray)) 100%)',
          border: '8px solid hsl(var(--ntc-blue))',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-professional)'
        }}
      >
        {/* NTC Logo and Header */}
        <div className="absolute top-6 left-6 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="text-left">
            <h4 style={{ color: 'hsl(var(--ntc-blue))', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
              NTC INTERN HUB
            </h4>
            <p style={{ color: 'hsl(var(--ntc-blue-dark))', fontSize: '12px', margin: 0 }}>
              Nepal Telecom Internship Program
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 opacity-10"
             style={{ background: 'radial-gradient(circle, hsl(var(--ntc-blue)) 0%, transparent 70%)' }}>
        </div>
        <div className="absolute bottom-4 left-4 w-24 h-24 opacity-10"
             style={{ background: 'radial-gradient(circle, hsl(var(--ntc-blue-light)) 0%, transparent 70%)' }}>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center h-full pt-20 pb-12 px-12 text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--ntc-blue))', 
              marginBottom: '8px',
              letterSpacing: '2px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              CERTIFICATE
            </h1>
            <h2 style={{ 
              fontSize: '1.25rem', 
              color: 'hsl(var(--ntc-blue-dark))', 
              letterSpacing: '4px',
              fontWeight: '600'
            }}>
              OF COMPLETION
            </h2>
          </div>

          {/* Certificate body */}
          <div className="mb-8 space-y-6">
            <p style={{ fontSize: '1.125rem', color: 'hsl(var(--foreground))' }}>
              This is to certify that
            </p>
            
            <div style={{ 
              borderBottom: '3px solid hsl(var(--ntc-blue))', 
              display: 'inline-block', 
              padding: '0 32px 8px',
              background: 'linear-gradient(135deg, hsl(var(--ntc-white)), hsl(var(--ntc-gray)))',
              borderRadius: '8px 8px 0 0'
            }}>
              <h3 style={{ 
                fontSize: '2.75rem', 
                fontWeight: 'bold', 
                color: 'hsl(var(--ntc-blue))',
                fontFamily: 'Georgia, serif',
                margin: 0
              }}>
                {data.intern_name}
              </h3>
            </div>

            <p style={{ 
              fontSize: '1.125rem', 
              color: 'hsl(var(--foreground))', 
              maxWidth: '32rem',
              lineHeight: '1.75',
              margin: '0 auto'
            }}>
              has successfully completed the internship program in
            </p>

            <div style={{ 
              background: 'linear-gradient(145deg, hsl(var(--ntc-white)), hsl(var(--ntc-gray)))',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid hsl(var(--ntc-blue))',
              boxShadow: 'var(--shadow-card)'
            }}>
              <h4 style={{ 
                fontSize: '1.875rem', 
                fontWeight: '600', 
                color: 'hsl(var(--ntc-blue))', 
                marginBottom: '16px',
                fontFamily: 'Georgia, serif'
              }}>
                {data.certificate_name}
              </h4>
              
              {data.skills_acquired && data.skills_acquired.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {data.skills_acquired.map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 12px',
                        background: 'hsl(var(--ntc-blue-light))',
                        color: 'hsl(var(--ntc-white))',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: '1px solid hsl(var(--ntc-blue))'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center items-center space-x-12 mt-8">
              <div className="text-center">
                <p style={{ fontSize: '1.125rem', color: 'hsl(var(--foreground))' }}>
                  Date of Completion
                </p>
                <p style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--ntc-blue))',
                  marginTop: '4px'
                }}>
                  {formattedDate}
                </p>
              </div>
              
              {data.performance_rating && (
                <div className="text-center">
                  <p style={{ fontSize: '1.125rem', color: 'hsl(var(--foreground))' }}>
                    Performance Rating
                  </p>
                  <div className="flex justify-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '1.5rem',
                          color: i < data.performance_rating! ? '#fbbf24' : '#d1d5db'
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-between items-end w-full">
            {data.supervisor_name && (
              <div className="text-center">
                <div style={{ 
                  borderTop: '2px solid hsl(var(--ntc-blue))', 
                  width: '200px', 
                  marginBottom: '8px'
                }}></div>
                <p style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: 'hsl(var(--ntc-blue))',
                  margin: 0
                }}>
                  {data.supervisor_name}
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'hsl(var(--muted-foreground))',
                  margin: 0
                }}>
                  Program Supervisor
                </p>
              </div>
            )}
            
            <div className="text-center">
              <div style={{ 
                borderTop: '2px solid hsl(var(--ntc-blue))', 
                width: '200px', 
                marginBottom: '8px'
              }}></div>
              <p style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'hsl(var(--ntc-blue))',
                margin: 0
              }}>
                Official Seal
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'hsl(var(--muted-foreground))',
                margin: 0
              }}>
                Nepal Telecom
              </p>
            </div>
          </div>
        </div>

        {/* Professional Border Pattern */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-20">
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: 'bold', 
            color: 'hsl(var(--ntc-blue))',
            letterSpacing: '1px'
          }}>
            NEPAL TELECOM INTERNSHIP PROGRAM
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;