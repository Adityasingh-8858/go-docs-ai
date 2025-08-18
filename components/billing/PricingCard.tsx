import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check } from 'lucide-react';

interface PricingCardProps {
    title: string;
    description: string;
    price: string;
    features: string[];
    isCurrentPlan: boolean;
    ctaButton: ReactNode;
}

export default function PricingCard({
    title,
    description,
    price,
    features,
    isCurrentPlan,
    ctaButton
}: PricingCardProps) {
    return (
        <Card className={cn("flex flex-col", { "border-2 border-purple-600": isCurrentPlan })}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="mb-6">
                    <span className="text-4xl font-bold">{price}</span>
                    {price !== "Free" && <span className="text-muted-foreground">/ month</span>}
                </div>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                            <Check className="h-5 w-5 text-green-500 mr-2" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                {ctaButton}
            </CardFooter>
        </Card>
    );
}
