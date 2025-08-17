import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Phone, MessageCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
}

interface ProfileEditorProps {
  profile: Profile;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    email: profile.email,
    department: profile.department || '',
    phone: profile.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleWhatsAppClick = (phoneNumber: string) => {
    if (!phoneNumber) {
      toast({
        title: "No phone number",
        description: "This user hasn't added their phone number yet",
        variant: "destructive",
      });
      return;
    }
    
    // Clean phone number and format for WhatsApp
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          department: formData.department || null,
          phone: formData.phone || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      const updatedProfile = {
        ...profile,
        full_name: formData.full_name,
        department: formData.department,
        phone: formData.phone,
      };

      onProfileUpdate(updatedProfile);
      setIsOpen(false);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </span>
          <div className="flex gap-2">
            {profile.phone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWhatsAppClick(profile.phone!)}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            )}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile information
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+977 9876543210"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Add your phone number to enable WhatsApp contact
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., IT, Marketing, Sales"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Name</Label>
          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Role</Label>
          <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
        </div>
        
        {profile.department && (
          <div>
            <Label className="text-sm font-medium">Department</Label>
            <p className="text-sm text-muted-foreground">{profile.department}</p>
          </div>
        )}
        
        <div>
          <Label className="text-sm font-medium">Phone</Label>
          <div className="flex items-center gap-2">
            {profile.phone ? (
              <>
                <p className="text-sm text-muted-foreground">{profile.phone}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsAppClick(profile.phone!)}
                  className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not provided</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;