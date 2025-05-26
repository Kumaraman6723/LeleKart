import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserAddress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Home,
  Building2,
  MapPin,
  Phone,
  User,
  PenSquare,
  Trash2,
  Plus,
  Star,
  CreditCard,
  Truck,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create a form schema for address validation
const addressFormSchema = z.object({
  addressName: z.string().min(1, "Address name is required"),
  fullName: z.string().min(1, "Full name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be exactly 6 digits")
    .max(6, "Pincode must be exactly 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain exactly 6 digits"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  isDefault: z.boolean().default(false),
  addressType: z.enum(["billing", "shipping", "both"]).default("both"),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  defaultValues?: AddressFormValues;
  onSubmit: (values: AddressFormValues) => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  defaultValues = {
    addressName: "",
    fullName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    isDefault: false,
    addressType: "both",
  },
  onSubmit,
  onCancel,
}) => {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="addressName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Name</FormLabel>
                <FormControl>
                  <Input placeholder="Home, Work, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Apt 4B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Pincode <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="400001"
                    {...field}
                    maxLength={6}
                    required
                    onKeyPress={(e) => {
                      // Allow only digits
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      // Only allow digits in the field
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      e.target.value = value;

                      field.onChange(e);
                      // Auto-populate city and state when pincode has 6 digits
                      const pincode = value;
                      console.log(
                        "Address Management Pincode changed:",
                        pincode
                      );
                      if (pincode && pincode.length === 6) {
                        // Fetch location data based on pincode
                        console.log(
                          "Fetching data for address mgmt pincode:",
                          pincode
                        );
                        fetch(`/api/pincode/${pincode}`)
                          .then((response) => {
                            console.log(
                              "Address Management Pincode API response:",
                              response.status
                            );
                            if (!response.ok) {
                              throw new Error("PIN code not found");
                            }
                            return response.json();
                          })
                          .then((data) => {
                            console.log(
                              "Address Management Pincode data received:",
                              data
                            );
                            // Update the state and city fields
                            console.log(
                              "Updating address mgmt form fields with pincode data:",
                              data.state,
                              data.district
                            );
                            form.setValue("state", data.state || "", {
                              shouldValidate: true,
                            });
                            form.setValue("city", data.district || "", {
                              shouldValidate: true,
                            });
                            console.log(
                              "Address management form fields updated:",
                              form.getValues("state"),
                              form.getValues("city")
                            );
                          })
                          .catch((error) => {
                            console.error(
                              "Error fetching location data:",
                              error
                            );
                            // Don't show error toast as this is optional functionality
                          });
                      }
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Enter a 6-digit pincode
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mumbai"
                    {...field}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Auto-populated from PIN code
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Maharashtra"
                    {...field}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Auto-populated from PIN code
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="9876543210"
                    {...field}
                    maxLength={10}
                    onKeyPress={(e) => {
                      // Allow only digits
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      // Only allow digits in the field
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      e.target.value = value;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Enter a 10-digit number without spaces or special characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="addressType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select address type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="billing">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Billing Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="shipping">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      <span>Shipping Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center">
                      <FileCheck className="h-4 w-4 mr-2" />
                      <span>Both Billing & Shipping</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how this address will be used
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as default address</FormLabel>
                <FormDescription>
                  This address will be used as your default shipping address
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Address</Button>
        </div>
      </form>
    </Form>
  );
};

const AddressCard: React.FC<{
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  onSetDefaultBilling?: (id: number) => void;
  onSetDefaultShipping?: (id: number) => void;
}> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  onSetDefaultBilling,
  onSetDefaultShipping,
}) => {
  // Function to render address type badge
  const renderAddressType = () => {
    switch (address.addressType) {
      case "billing":
        return <Badge className="bg-blue-500 mr-2">Billing</Badge>;
      case "shipping":
        return <Badge className="bg-green-500 mr-2">Shipping</Badge>;
      case "both":
        return <Badge className="bg-purple-500 mr-2">Billing & Shipping</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="relative">
      <div className="absolute top-2 right-2 flex space-x-2">
        {renderAddressType()}
        {address.isDefaultBilling && (
          <Badge className="bg-blue-500">Default Billing</Badge>
        )}
        {address.isDefaultShipping && (
          <Badge className="bg-green-500">Default Shipping</Badge>
        )}
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {address.addressName === "Home" ? (
              <Home className="h-5 w-5" />
            ) : address.addressName === "Work" ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
            <CardTitle>{address.addressName}</CardTitle>
          </div>
        </div>
        <CardDescription>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{address.fullName}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Phone className="h-4 w-4" />
            <span>{address.phone}</span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{address.address}</p>
        <p className="text-sm mt-1">
          {address.city}, {address.state} - {address.pincode}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <div className="flex space-x-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(address)}
            className="flex items-center"
          >
            <PenSquare className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center text-red-500 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this address. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(address.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          {(address.addressType === "shipping" ||
            address.addressType === "both") &&
            !address.isDefaultShipping &&
            onSetDefaultShipping && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDefaultShipping(address.id)}
                className="flex items-center"
              >
                <Truck className="h-4 w-4 mr-1" />
                Set as Default Shipping
              </Button>
            )}
          {(address.addressType === "billing" ||
            address.addressType === "both") &&
            !address.isDefaultBilling &&
            onSetDefaultBilling && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDefaultBilling(address.id)}
                className="flex items-center"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Set as Default Billing
              </Button>
            )}
          {!address.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSetDefault(address.id)}
              className="flex items-center"
            >
              <Star className="h-4 w-4 mr-1" />
              Set as Default
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const AddressManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );

  // Fetch addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ["/api/addresses"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/addresses");
      return response.json();
    },
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: AddressFormValues) => {
      const response = await apiRequest("POST", "/api/addresses", addressData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Address added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add address",
        variant: "destructive",
      });
      console.error("Failed to add address:", error);
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({
      id,
      addressData,
    }: {
      id: number;
      addressData: AddressFormValues;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/addresses/${id}`,
        addressData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setIsEditDialogOpen(false);
      setSelectedAddress(null);
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
      console.error("Failed to update address:", error);
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/addresses/${id}`);
      // If the response is not ok, try to extract error message from JSON
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to delete address" }));
        throw new Error(errorData.error || "Failed to delete address");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    },
    onError: (error: Error) => {
      // Use the specific error message if available
      const errorMessage =
        error.message && error.message !== "Failed to delete address"
          ? error.message
          : "Failed to delete address. Please try again.";

      toast({
        title: "Unable to Delete Address",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Failed to delete address:", error);
    },
  });

  // Set default address mutation
  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/addresses/${id}/set-default`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Default address updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive",
      });
      console.error("Failed to update default address:", error);
    },
  });

  // Set default billing address mutation
  const setDefaultBillingAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/addresses/${id}/set-default-billing`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Default billing address updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update default billing address",
        variant: "destructive",
      });
      console.error("Failed to update default billing address:", error);
    },
  });

  // Set default shipping address mutation
  const setDefaultShippingAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "POST",
        `/api/addresses/${id}/set-default-shipping`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Default shipping address updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update default shipping address",
        variant: "destructive",
      });
      console.error("Failed to update default shipping address:", error);
    },
  });

  // Handle form submission for adding a new address
  const handleAddAddress = (values: AddressFormValues) => {
    createAddressMutation.mutate(values);
  };

  // Handle form submission for updating an address
  const handleUpdateAddress = (values: AddressFormValues) => {
    if (selectedAddress) {
      updateAddressMutation.mutate({
        id: selectedAddress.id,
        addressData: values,
      });
    }
  };

  // Handle edit button click
  const handleEditClick = (address: UserAddress) => {
    setSelectedAddress(address);
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (id: number) => {
    deleteAddressMutation.mutate(id);
  };

  // Handle set default button click
  const handleSetDefaultClick = (id: number) => {
    setDefaultAddressMutation.mutate(id);
  };

  // Handle set default billing address click
  const handleSetDefaultBillingClick = (id: number) => {
    setDefaultBillingAddressMutation.mutate(id);
  };

  // Handle set default shipping address click
  const handleSetDefaultShippingClick = (id: number) => {
    setDefaultShippingAddressMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="container max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Addresses</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
                <DialogDescription>
                  Enter the details for your new address
                </DialogDescription>
              </DialogHeader>
              <AddressForm
                onSubmit={handleAddAddress}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
            Address Types
          </h2>
          <p className="text-sm text-slate-600 mb-2">
            We now support separate billing and shipping addresses to provide
            more flexibility:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-4">
            <li>
              <span className="font-medium">Billing Only:</span> Used for
              invoice and payment information
            </li>
            <li>
              <span className="font-medium">Shipping Only:</span> Used for
              delivery of your orders
            </li>
            <li>
              <span className="font-medium">Both:</span> Can be used for both
              billing and shipping purposes
            </li>
          </ul>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="relative">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-24 mr-2" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address: UserAddress) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onSetDefault={handleSetDefaultClick}
                onSetDefaultBilling={handleSetDefaultBillingClick}
                onSetDefaultShipping={handleSetDefaultShippingClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No addresses found</h3>
            <p className="text-gray-500 mb-6">
              You don't have any saved addresses yet. Add an address to make
              checkout faster.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        )}

        {/* Edit Address Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>
                Update the details for your address
              </DialogDescription>
            </DialogHeader>
            {selectedAddress && (
              <AddressForm
                defaultValues={{
                  addressName: selectedAddress.addressName,
                  fullName: selectedAddress.fullName,
                  address: selectedAddress.address,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  pincode: selectedAddress.pincode,
                  phone: selectedAddress.phone,
                  isDefault: selectedAddress.isDefault,
                  addressType: selectedAddress.addressType || "both",
                }}
                onSubmit={handleUpdateAddress}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedAddress(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AddressManagement;
