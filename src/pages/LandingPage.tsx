import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Calendar, Award, MessageSquare, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Task Management",
      description: "Kanban-style task board for efficient intern workflow management"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Event Scheduling",
      description: "Integrated calendar system for meetings and deadlines"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Real-time Messaging",
      description: "Direct communication between supervisors and interns"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Performance Tracking",
      description: "Comprehensive feedback and evaluation system"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Digital Certificates",
      description: "Generate and manage completion certificates"
    },
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Professional Platform",
      description: "Enterprise-grade solution for NTC's internship program"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-ntc-gray to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">NTC Intern Hub</h1>
                <p className="text-sm text-muted-foreground">Nepal Telecom</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Empowering Nepal's Future
              <span className="block text-primary">Through Digital Excellence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Nepal Telecom's comprehensive Intern Management System streamlines internship programs,
              fostering collaboration between supervisors and interns while building the next generation
              of telecommunications professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=signup">
                <Button size="lg" className="min-w-[180px]">
                  Join as Intern
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="lg" variant="outline" className="min-w-[180px]">
                  Supervisor Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About NTC Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">About Nepal Telecom</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                As Nepal's leading telecommunications service provider, NTC has been connecting communities
                and driving digital transformation across the nation for decades.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Our Legacy</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Established as the national telecommunications authority, NTC has pioneered
                    connectivity solutions throughout Nepal's diverse terrain.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Innovation Focus</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Leading the digital revolution with cutting-edge technology and infrastructure
                    development across urban and rural Nepal.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Future Ready</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">
                    Investing in young talent through comprehensive internship programs that shape
                    the future of telecommunications in Nepal.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Platform Features</h2>
              <p className="text-lg text-muted-foreground">
                Comprehensive tools designed for effective internship management
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join Nepal Telecom's internship program and be part of the digital transformation
              that's shaping our nation's future.
            </p>
            <Link to="/auth?tab=signup">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Nepal Telecom</p>
                <p className="text-sm text-muted-foreground">Intern Management System</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Nepal Telecom. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;