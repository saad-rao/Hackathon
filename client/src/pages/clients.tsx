import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, User } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import type { Client } from "@shared/schema";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients?.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cnic.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-clients-title">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client information and risk profiles
          </p>
        </div>
        <Link href="/clients/new">
          <Button data-testid="button-add-client">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or CNIC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-clients"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredClients && filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover-elevate transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate" data-testid={`text-client-name-${client.id}`}>
                        {client.name}
                      </CardTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-1" data-testid={`text-client-cnic-${client.id}`}>
                        {client.cnic}
                      </p>
                    </div>
                  </div>
                  <RiskBadge level={client.riskLevel as "low" | "medium" | "high"} showIcon={false} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Income</p>
                    <p className="font-semibold font-mono">{client.monthlyIncome.toLocaleString()} PKR</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Employment</p>
                    <p className="font-medium capitalize">{client.employmentStatus}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-mono">{client.phone}</p>
                </div>
                <Link href={`/clients/${client.id}`}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-client-${client.id}`}>
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No clients found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term" : "Add your first client to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
