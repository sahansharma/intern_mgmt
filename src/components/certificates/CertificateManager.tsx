import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createNotification, notificationTemplates } from '@/services/notificationService';

interface Certificate {
  id: string;
  certificate_name: string;
  certificate_url?: string;
  skills_acquired?: string[];
  completion_date: string;
  performance_rating?: number;
  intern_id: string;
  supervisor_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface CertificateManagerProps {
  userRole: string;
  userId: string;
}

const CertificateManager: React.FC<CertificateManagerProps> = ({ userRole, userId }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [interns, setInterns] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newCertificate, setNewCertificate] = useState({
    certificate_name: '',
    certificate_url: '',
    skills_acquired: '',
    completion_date: '',
    performance_rating: '',
    intern_id: '',
  });

  useEffect(() => {
    fetchCertificates();
    fetchInterns();
  }, [userId]);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('supervisor_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch certificates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern');

      if (error) throw error;
      setInterns(data || []);
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const createCertificate = async () => {
    if (!newCertificate.certificate_name || !newCertificate.intern_id || !newCertificate.completion_date) {
      toast({
        title: "Validation Error",
        description: "Certificate name, intern, and completion date are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const skillsArray = newCertificate.skills_acquired
        ? newCertificate.skills_acquired.split(',').map(skill => skill.trim())
        : [];

      const { error } = await supabase.from('certificates').insert({
        certificate_name: newCertificate.certificate_name,
        certificate_url: newCertificate.certificate_url || null,
        skills_acquired: skillsArray,
        completion_date: newCertificate.completion_date,
        performance_rating: newCertificate.performance_rating ? parseInt(newCertificate.performance_rating) : null,
        intern_id: newCertificate.intern_id,
        supervisor_id: userId,
      });

      if (error) throw error;

      // Send notification to intern about new certificate
      await createNotification({
        userId: newCertificate.intern_id,
        ...notificationTemplates.certificateIssued(newCertificate.certificate_name),
        data: { certificateName: newCertificate.certificate_name }
      });

      toast({
        title: "Success",
        description: "Certificate created successfully",
      });

      setNewCertificate({
        certificate_name: '',
        certificate_url: '',
        skills_acquired: '',
        completion_date: '',
        performance_rating: '',
        intern_id: '',
      });
      setIsDialogOpen(false);
      fetchCertificates();
    } catch (error) {
      console.error('Error creating certificate:', error);
      toast({
        title: "Error",
        description: "Failed to create certificate",
        variant: "destructive",
      });
    }
  };

  const getInternName = (internId: string) => {
    const intern = interns.find(i => i.id === internId);
    return intern ? intern.full_name : 'Unknown';
  };

  if (loading) {
    return <div className="text-center py-8">Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certificate Management</h2>
          <p className="text-muted-foreground">Issue and manage completion certificates</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Issue Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue New Certificate</DialogTitle>
              <DialogDescription>Create a completion certificate for an intern</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="certificate_name">Certificate Name</Label>
                <Input
                  id="certificate_name"
                  value={newCertificate.certificate_name}
                  onChange={(e) => setNewCertificate({ ...newCertificate, certificate_name: e.target.value })}
                  placeholder="e.g., Web Development Internship"
                />
              </div>
              
              <div>
                <Label htmlFor="intern_id">Select Intern</Label>
                <Select value={newCertificate.intern_id} onValueChange={(value) => setNewCertificate({ ...newCertificate, intern_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((intern) => (
                      <SelectItem key={intern.id} value={intern.id}>
                        {intern.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="completion_date">Completion Date</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={newCertificate.completion_date}
                    onChange={(e) => setNewCertificate({ ...newCertificate, completion_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="performance_rating">Rating (1-10)</Label>
                  <Input
                    id="performance_rating"
                    type="number"
                    min="1"
                    max="10"
                    value={newCertificate.performance_rating}
                    onChange={(e) => setNewCertificate({ ...newCertificate, performance_rating: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="skills_acquired">Skills Acquired</Label>
                <Textarea
                  id="skills_acquired"
                  value={newCertificate.skills_acquired}
                  onChange={(e) => setNewCertificate({ ...newCertificate, skills_acquired: e.target.value })}
                  placeholder="Comma-separated skills (e.g., React, Node.js, TypeScript)"
                />
              </div>
              
              <div>
                <Label htmlFor="certificate_url">Certificate URL</Label>
                <Input
                  id="certificate_url"
                  value={newCertificate.certificate_url}
                  onChange={(e) => setNewCertificate({ ...newCertificate, certificate_url: e.target.value })}
                  placeholder="Optional download link"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCertificate}>
                  Issue Certificate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {getInternName(certificate.intern_id)}
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Completed: {new Date(certificate.completion_date).toLocaleDateString()}
                </div>
                
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No certificates issued yet</p>
            <p className="text-muted-foreground">Start by issuing your first certificate</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CertificateManager;