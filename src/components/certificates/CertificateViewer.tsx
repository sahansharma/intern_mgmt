import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, Download, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CertificateTemplate from './CertificateTemplate';
import { useToast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  certificate_name: string;
  certificate_url?: string;
  skills_acquired?: string[];
  completion_date: string;
  performance_rating?: number;
  created_at: string;
  intern_id: string;
  supervisor_id: string;
}

interface CertificateViewerProps {
  userId: string;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ userId }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [supervisorNames, setSupervisorNames] = useState<Record<string, string>>({});
  const [internNames, setInternNames] = useState<Record<string, string>>({});
  const certificateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCertificates();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('intern_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching certificates:', error);
        return;
      }

      setCertificates(data || []);
      
      // Fetch supervisor and intern names
      if (data && data.length > 0) {
        const supervisorIds = [...new Set(data.map(cert => cert.supervisor_id))];
        const internIds = [...new Set(data.map(cert => cert.intern_id))];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', [...supervisorIds, ...internIds]);

        if (profiles) {
          const supervisorMap: Record<string, string> = {};
          const internMap: Record<string, string> = {};
          
          profiles.forEach(profile => {
            if (supervisorIds.includes(profile.id)) {
              supervisorMap[profile.id] = profile.full_name;
            }
            if (internIds.includes(profile.id)) {
              internMap[profile.id] = profile.full_name;
            }
          });
          
          setSupervisorNames(supervisorMap);
          setInternNames(internMap);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async (certificate: Certificate) => {
    if (!certificateRef.current) return;

    try {
      toast({
        title: "Generating certificate...",
        description: "Please wait while we prepare your certificate for download.",
      });

      // Create canvas from the certificate
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${certificate.certificate_name.replace(/\s+/g, '_')}_Certificate.pdf`);

      toast({
        title: "Certificate downloaded!",
        description: "Your certificate has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Download failed",
        description: "There was an error generating your certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Certificates</h2>
        <p className="text-muted-foreground">View and download your completion certificates</p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{certificate.certificate_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(certificate.completion_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {certificate.performance_rating && (
                    <Badge variant="secondary">
                      {certificate.performance_rating}/10
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificate.skills_acquired && certificate.skills_acquired.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills Acquired</h4>
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills_acquired.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Certificate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Certificate Preview</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center p-4">
                        <CertificateTemplate
                          ref={certificateRef}
                          data={{
                            certificate_name: certificate.certificate_name,
                            intern_name: internNames[certificate.intern_id] || 'Unknown Intern',
                            completion_date: certificate.completion_date,
                            skills_acquired: certificate.skills_acquired || [],
                            performance_rating: certificate.performance_rating || undefined,
                            supervisor_name: supervisorNames[certificate.supervisor_id] || 'Unknown Supervisor',
                          }}
                        />
                      </div>
                      <div className="flex justify-center p-4">
                        <Button onClick={() => downloadCertificate(certificate)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Certificate
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {certificate.certificate_url && (
                    <Button variant="outline" asChild>
                      <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        External Link
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No certificates yet</p>
            <p className="text-muted-foreground">Complete your internship to receive certificates</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden certificate template for PDF generation */}
      <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
        <CertificateTemplate
          ref={certificateRef}
          data={{
            certificate_name: '',
            intern_name: '',
            completion_date: '',
            skills_acquired: [],
          }}
        />
      </div>
    </div>
  );
};

export default CertificateViewer;