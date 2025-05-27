import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SellerDashboardLayout } from "@/components/layout/seller-dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
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
import {
  Bell,
  Calendar,
  Check,
  CreditCard,
  HelpCircle,
  Loader2,
  LogOut,
  Mailbox,
  MessageSquare,
  Moon,
  Percent,
  PhoneCall,
  Save,
  Settings,
  ShieldAlert,
  Sun,
  Truck,
  UserCog,
  Wallet,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SellerSettingsPage() {
  const [currentTab, setCurrentTab] = useState("account");
  const [holidayMode, setHolidayMode] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPersonalInfo, setIsSavingPersonalInfo] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSavingPickupAddress, setIsSavingPickupAddress] = useState(false);
  const [isSavingStoreSettings, setIsSavingStoreSettings] = useState(false);
  const [isSavingBillingInfo, setIsSavingBillingInfo] = useState(false);
  const [isSavingBankInfo, setIsSavingBankInfo] = useState(false);

  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    logo: "",
    banner: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      website: "",
    },
    businessHours: [
      { day: "Monday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Tuesday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Wednesday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Thursday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Friday", open: true, openTime: "09:00", closeTime: "18:00" },
      { day: "Saturday", open: true, openTime: "10:00", closeTime: "16:00" },
      { day: "Sunday", open: false, openTime: "", closeTime: "" },
    ],
  });

  // Personal information state
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
  });

  // Address information state
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Pickup address state (for seller address on invoices)
  const [pickupAddress, setPickupAddress] = useState({
    businessName: "",
    gstin: "",
    contactName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    authorizationSignature: "",
  });

  // Billing information state
  const [billingInfo, setBillingInfo] = useState({
    gstin: "",
    businessName: "",
    panNumber: "",
    businessType: "individual",
  });

  // Bank account information state
  const [bankInfo, setBankInfo] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: false,
    },
    sms: {
      orders: true,
      payments: false,
      returns: false,
      reviews: false,
      promotions: false,
    },
    push: {
      orders: true,
      payments: true,
      returns: true,
      reviews: true,
      promotions: true,
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seller settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["/api/seller/settings"],
    queryFn: async () => {
      const res = await fetch("/api/seller/settings");
      if (!res.ok) {
        throw new Error("Failed to fetch settings");
      }
      return res.json();
    },
  });

  // Process settings data when it changes
  useEffect(() => {
    if (settings) {
      setHolidayMode(settings.holidayMode || false);

      // Parse and set notification preferences
      if (settings.notificationPreferences) {
        try {
          setNotificationSettings(JSON.parse(settings.notificationPreferences));
        } catch (e) {
          console.error("Error parsing notification preferences:", e);
        }
      }

      // Parse and set personal info
      if (settings.personalInfo) {
        try {
          const parsedPersonalInfo = JSON.parse(settings.personalInfo);
          setPersonalInfo({
            name: parsedPersonalInfo.name || "",
            email: parsedPersonalInfo.email || "",
            phone: parsedPersonalInfo.phone || "",
            alternatePhone: parsedPersonalInfo.alternatePhone || "",
          });
        } catch (e) {
          console.error("Error parsing personal info:", e);
        }
      }

      // Parse and set address
      if (settings.address) {
        try {
          const parsedAddress = JSON.parse(settings.address);
          setAddress({
            line1: parsedAddress.line1 || "",
            line2: parsedAddress.line2 || "",
            city: parsedAddress.city || "",
            state: parsedAddress.state || "",
            pincode: parsedAddress.pincode || "",
          });
        } catch (e) {
          console.error("Error parsing address:", e);
        }
      }

      // Parse and set pickup address
      if (settings.pickupAddress) {
        try {
          const parsedPickupAddress = JSON.parse(settings.pickupAddress);
          setPickupAddress({
            businessName: parsedPickupAddress.businessName || "",
            gstin: parsedPickupAddress.gstin || "",
            contactName: parsedPickupAddress.contactName || "",
            phone: parsedPickupAddress.phone || "",
            line1: parsedPickupAddress.line1 || "",
            line2: parsedPickupAddress.line2 || "",
            city: parsedPickupAddress.city || "",
            state: parsedPickupAddress.state || "",
            pincode: parsedPickupAddress.pincode || "",
            authorizationSignature:
              parsedPickupAddress.authorizationSignature || "",
          });
        } catch (e) {
          console.error("Error parsing pickup address:", e);
        }
      }

      // Parse and set tax information for billing
      if (settings.taxInformation) {
        try {
          const parsedTaxInfo = JSON.parse(settings.taxInformation);
          setBillingInfo({
            gstin: parsedTaxInfo.gstin || "",
            businessName: parsedTaxInfo.businessName || "",
            panNumber: parsedTaxInfo.panNumber || "",
            businessType: parsedTaxInfo.businessType || "individual",
          });

          // Also set bank information if it's part of tax information
          if (parsedTaxInfo.bankInfo) {
            setBankInfo({
              accountName: parsedTaxInfo.bankInfo.accountName || "",
              accountNumber: parsedTaxInfo.bankInfo.accountNumber || "",
              ifscCode: parsedTaxInfo.bankInfo.ifscCode || "",
              bankName: parsedTaxInfo.bankInfo.bankName || "",
              branchName: parsedTaxInfo.bankInfo.branchName || "",
            });
          }
        } catch (e) {
          console.error("Error parsing tax information:", e);
        }
      }

      // Parse and set store settings
      if (settings.store) {
        try {
          const parsedStoreSettings = JSON.parse(settings.store);
          setStoreSettings({
            name: parsedStoreSettings.name || "",
            description: parsedStoreSettings.description || "",
            contactEmail: parsedStoreSettings.contactEmail || "",
            contactPhone: parsedStoreSettings.contactPhone || "",
            logo: parsedStoreSettings.logo || "",
            banner: parsedStoreSettings.banner || "",
            socialLinks: {
              facebook: parsedStoreSettings.socialLinks?.facebook || "",
              instagram: parsedStoreSettings.socialLinks?.instagram || "",
              twitter: parsedStoreSettings.socialLinks?.twitter || "",
              website: parsedStoreSettings.socialLinks?.website || "",
            },
            businessHours: parsedStoreSettings.businessHours || [
              {
                day: "Monday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Tuesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Wednesday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Thursday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Friday",
                open: true,
                openTime: "09:00",
                closeTime: "18:00",
              },
              {
                day: "Saturday",
                open: true,
                openTime: "10:00",
                closeTime: "16:00",
              },
              { day: "Sunday", open: false, openTime: "", closeTime: "" },
            ],
          });
        } catch (e) {
          console.error("Error parsing store settings:", e);
        }
      }
    }
  }, [settings]);

  const toggleHolidayMode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seller/settings/holiday-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: !holidayMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update holiday mode");
      }

      setHolidayMode(!holidayMode);
      toast({
        title: !holidayMode
          ? "Holiday Mode Activated"
          : "Holiday Mode Deactivated",
        description: !holidayMode
          ? "Your store is now in holiday mode and won't accept new orders."
          : "Your store is now active and accepting new orders.",
      });
    } catch (error) {
      console.error("Error toggling holiday mode:", error);
      toast({
        title: "Action Failed",
        description: "Could not update holiday mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);
    try {
      // Transform the nested notification settings to the flat structure expected by the API
      const transformedSettings = {
        email:
          notificationSettings.email.orders ||
          notificationSettings.email.payments ||
          notificationSettings.email.returns ||
          notificationSettings.email.reviews ||
          notificationSettings.email.promotions,
        sms:
          notificationSettings.sms.orders ||
          notificationSettings.sms.payments ||
          notificationSettings.sms.returns,
        push:
          notificationSettings.push.orders ||
          notificationSettings.push.payments ||
          notificationSettings.push.returns ||
          notificationSettings.push.reviews ||
          notificationSettings.push.promotions,
        orderNotifications:
          notificationSettings.email.orders ||
          notificationSettings.sms.orders ||
          notificationSettings.push.orders,
        paymentNotifications:
          notificationSettings.email.payments ||
          notificationSettings.sms.payments ||
          notificationSettings.push.payments,
        returnNotifications:
          notificationSettings.email.returns ||
          notificationSettings.sms.returns ||
          notificationSettings.push.returns,
        promotionNotifications:
          notificationSettings.email.promotions ||
          notificationSettings.push.promotions,
      };

      const response = await fetch("/api/seller/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error("Failed to update notification settings");
      }

      toast({
        title: "Settings Saved",
        description:
          "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Save Failed",
        description:
          "Could not update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (
    channel: "email" | "sms" | "push",
    setting: string,
    checked: boolean
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [setting]: checked,
      },
    }));
  };

  const savePersonalInfo = async () => {
    setIsSavingPersonalInfo(true);
    try {
      const response = await fetch("/api/seller/settings/personal-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(personalInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to update personal information");
      }

      toast({
        title: "Personal Information Saved",
        description: "Your personal information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving personal information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPersonalInfo(false);
    }
  };

  const saveAddress = async () => {
    if (!address.pincode || address.pincode.length !== 6) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setIsSavingAddress(true);
    try {
      const response = await fetch("/api/seller/settings/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        throw new Error("Failed to update address information");
      }

      toast({
        title: "Address Information Saved",
        description: "Your address information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving address information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update address information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const saveStoreSettings = async () => {
    setIsSavingStoreSettings(true);
    try {
      // We'll use the general settings endpoint and store our data in a "store" field
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store: JSON.stringify(storeSettings),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update store settings");
      }

      toast({
        title: "Store Settings Saved",
        description: "Your store settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving store settings:", error);
      toast({
        title: "Save Failed",
        description: "Could not update store settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingStoreSettings(false);
    }
  };

  const savePickupAddress = async () => {
    if (!pickupAddress.pincode || pickupAddress.pincode.length !== 6) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPickupAddress(true);
    try {
      const response = await fetch("/api/seller/settings/pickup-address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickupAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update pickup address");
      }

      // Invalidate the settings query to force a refetch
      queryClient.invalidateQueries(["/api/seller/settings"]);

      toast({
        title: "Pickup Address Saved",
        description:
          "Your pickup address has been updated successfully. This address will be used on invoices.",
      });
    } catch (error) {
      console.error("Error saving pickup address:", error);
      toast({
        title: "Save Failed",
        description: "Could not update pickup address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPickupAddress(false);
    }
  };

  const saveBillingInfo = async () => {
    setIsSavingBillingInfo(true);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify({
            ...billingInfo,
            // Don't include bank info here, as we'll send it separately
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update billing information");
      }

      toast({
        title: "Billing Information Saved",
        description: "Your billing information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving billing information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update billing information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBillingInfo(false);
    }
  };

  const saveBankInfo = async () => {
    setIsSavingBankInfo(true);
    try {
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxInformation: JSON.stringify({
            bankInfo: bankInfo,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bank information");
      }

      toast({
        title: "Bank Information Saved",
        description:
          "Your bank account information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving bank information:", error);
      toast({
        title: "Save Failed",
        description: "Could not update bank information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBankInfo(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      // Here would be the API call to change password
      // For demonstration, we're just simulating success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsPasswordDialogOpen(false);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Could not update your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SellerDashboardLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <Tabs
              orientation="vertical"
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1 p-0">
                <TabsTrigger
                  value="account"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="store"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Store Settings
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </TabsTrigger>
                <TabsTrigger
                  value="pickup_address"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Pickup Address
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="justify-start px-3 py-2 h-9 data-[state=active]:bg-muted"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="md:w-3/4">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsContent value="account" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={personalInfo.name}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) =>
                            setPersonalInfo({
                              ...personalInfo,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={personalInfo.phone}
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
                            setPersonalInfo({ ...personalInfo, phone: value });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alternatePhone">
                          Alternate Phone (Optional)
                        </Label>
                        <Input
                          id="alternatePhone"
                          value={personalInfo.alternatePhone}
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
                            setPersonalInfo({
                              ...personalInfo,
                              alternatePhone: value,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={savePersonalInfo}
                      disabled={isSavingPersonalInfo}
                    >
                      {isSavingPersonalInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Address Information</CardTitle>
                    <CardDescription>
                      Manage your address details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input
                        id="addressLine1"
                        value={address.line1}
                        onChange={(e) =>
                          setAddress({ ...address, line1: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">
                        Address Line 2 (Optional)
                      </Label>
                      <Input
                        id="addressLine2"
                        value={address.line2}
                        onChange={(e) =>
                          setAddress({ ...address, line2: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pincode"
                          value={address.pincode}
                          maxLength={6}
                          required
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={async (e) => {
                            // Only allow digits in the field
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            e.target.value = value;

                            const pincode = value;
                            setAddress({ ...address, pincode });
                            console.log("Pincode changed:", pincode);

                            // If pincode is 6 digits, try to auto-populate city and state
                            if (pincode.length === 6) {
                              console.log(
                                "Fetching data for pincode:",
                                pincode
                              );
                              try {
                                const response = await fetch(
                                  `/api/pincode/${pincode}`
                                );
                                console.log(
                                  "Pincode API response:",
                                  response.status
                                );
                                if (response.ok) {
                                  const data = await response.json();
                                  console.log("Pincode data received:", data);
                                  if (data && data.state) {
                                    console.log(
                                      "Setting address with pincode data:",
                                      data.state,
                                      data.district
                                    );
                                    setAddress((prev) => ({
                                      ...prev,
                                      pincode,
                                      city: data.district || prev.city,
                                      state: data.state || prev.state,
                                    }));
                                  }
                                }
                              } catch (error) {
                                console.error(
                                  "Error fetching pincode data:",
                                  error
                                );
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 6-digit pincode
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City/District</Label>
                        <Input
                          id="city"
                          value={address.city}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          onChange={(e) =>
                            setAddress({ ...address, city: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={address.state}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          onChange={(e) =>
                            setAddress({ ...address, state: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveAddress} disabled={isSavingAddress}>
                      {isSavingAddress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to be notified
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        Email Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="email-orders"
                            checked={notificationSettings.email.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "orders",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="email-payments"
                            checked={notificationSettings.email.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="email-returns"
                            checked={notificationSettings.email.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-reviews" className="flex-1">
                              Customer Reviews
                            </Label>
                          </div>
                          <Switch
                            id="email-reviews"
                            checked={notificationSettings.email.reviews}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "reviews",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <Label
                              htmlFor="email-promotions"
                              className="flex-1"
                            >
                              Promotions & Offers
                            </Label>
                          </div>
                          <Switch
                            id="email-promotions"
                            checked={notificationSettings.email.promotions}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "email",
                                "promotions",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        SMS Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="sms-orders"
                            checked={notificationSettings.sms.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange("sms", "orders", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="sms-payments"
                            checked={notificationSettings.sms.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "sms",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sms-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="sms-returns"
                            checked={notificationSettings.sms.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "sms",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-4">
                        Push Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mailbox className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-orders" className="flex-1">
                              New Orders
                            </Label>
                          </div>
                          <Switch
                            id="push-orders"
                            checked={notificationSettings.push.orders}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "orders",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-payments" className="flex-1">
                              Payment Updates
                            </Label>
                          </div>
                          <Switch
                            id="push-payments"
                            checked={notificationSettings.push.payments}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "payments",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-returns" className="flex-1">
                              Returns & Refunds
                            </Label>
                          </div>
                          <Switch
                            id="push-returns"
                            checked={notificationSettings.push.returns}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "returns",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-reviews" className="flex-1">
                              Customer Reviews
                            </Label>
                          </div>
                          <Switch
                            id="push-reviews"
                            checked={notificationSettings.push.reviews}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "reviews",
                                checked
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-promotions" className="flex-1">
                              Promotions & Offers
                            </Label>
                          </div>
                          <Switch
                            id="push-promotions"
                            checked={notificationSettings.push.promotions}
                            onCheckedChange={(checked) =>
                              handleNotificationChange(
                                "push",
                                "promotions",
                                checked
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveNotificationSettings}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="store" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>
                      Manage your store's basic information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={storeSettings.name}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your Store Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeDescription">
                        Store Description
                      </Label>
                      <Textarea
                        id="storeDescription"
                        rows={4}
                        value={storeSettings.description}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe your store and what you sell..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={storeSettings.contactEmail}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              contactEmail: e.target.value,
                            })
                          }
                          placeholder="store@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={storeSettings.contactPhone}
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
                            setStoreSettings({
                              ...storeSettings,
                              contactPhone: value,
                            });
                          }}
                          placeholder="9876543210"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveStoreSettings}
                      disabled={isSavingStoreSettings}
                    >
                      {isSavingStoreSettings ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Store Branding</CardTitle>
                    <CardDescription>
                      Customize your store's appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeLogo">Store Logo</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="storeLogo"
                              value={storeSettings.logo}
                              onChange={(e) =>
                                setStoreSettings({
                                  ...storeSettings,
                                  logo: e.target.value,
                                })
                              }
                              placeholder="https://example.com/logo.png"
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground">
                              or
                            </span>
                            <FileUpload
                              onChange={(url) =>
                                setStoreSettings({
                                  ...storeSettings,
                                  logo: url,
                                })
                              }
                              value={storeSettings.logo}
                              label="Upload Logo"
                              accept="image/*"
                              maxSizeMB={2}
                              id="logo-upload"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Recommended size: 200x200px. Max file size: 2MB.
                            Supported formats: JPG, PNG, SVG.
                          </div>
                        </div>
                        {storeSettings.logo && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={storeSettings.logo}
                              alt="Store Logo"
                              className="h-20 w-auto object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/150?text=Logo+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeBanner">Store Banner</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Input
                              id="storeBanner"
                              value={storeSettings.banner}
                              onChange={(e) =>
                                setStoreSettings({
                                  ...storeSettings,
                                  banner: e.target.value,
                                })
                              }
                              placeholder="https://example.com/banner.jpg"
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground">
                              or
                            </span>
                            <FileUpload
                              onChange={(url) =>
                                setStoreSettings({
                                  ...storeSettings,
                                  banner: url,
                                })
                              }
                              value={storeSettings.banner}
                              label="Upload Banner"
                              accept="image/*"
                              maxSizeMB={5}
                              id="banner-upload"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Recommended size: 1200x300px. Max file size: 5MB.
                            Supported formats: JPG, PNG.
                          </div>
                        </div>
                        {storeSettings.banner && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={storeSettings.banner}
                              alt="Store Banner"
                              className="h-20 w-full object-cover rounded-md"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/800x200?text=Banner+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveStoreSettings}
                      disabled={isSavingStoreSettings}
                    >
                      {isSavingStoreSettings ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>
                      Connect your store to social networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebookLink">
                          <div className="flex items-center">
                            <span className="mr-2">Facebook</span>
                          </div>
                        </Label>
                        <Input
                          id="facebookLink"
                          value={storeSettings.socialLinks.facebook}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              socialLinks: {
                                ...storeSettings.socialLinks,
                                facebook: e.target.value,
                              },
                            })
                          }
                          placeholder="https://facebook.com/your-page"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagramLink">
                          <div className="flex items-center">
                            <span className="mr-2">Instagram</span>
                          </div>
                        </Label>
                        <Input
                          id="instagramLink"
                          value={storeSettings.socialLinks.instagram}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              socialLinks: {
                                ...storeSettings.socialLinks,
                                instagram: e.target.value,
                              },
                            })
                          }
                          placeholder="https://instagram.com/your-handle"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitterLink">
                          <div className="flex items-center">
                            <span className="mr-2">Twitter</span>
                          </div>
                        </Label>
                        <Input
                          id="twitterLink"
                          value={storeSettings.socialLinks.twitter}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              socialLinks: {
                                ...storeSettings.socialLinks,
                                twitter: e.target.value,
                              },
                            })
                          }
                          placeholder="https://twitter.com/your-handle"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="websiteLink">
                          <div className="flex items-center">
                            <span className="mr-2">Website</span>
                          </div>
                        </Label>
                        <Input
                          id="websiteLink"
                          value={storeSettings.socialLinks.website}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              socialLinks: {
                                ...storeSettings.socialLinks,
                                website: e.target.value,
                              },
                            })
                          }
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveStoreSettings}
                      disabled={isSavingStoreSettings}
                    >
                      {isSavingStoreSettings ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>
                      Set your store operating hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {storeSettings.businessHours.map((dayHours, index) => (
                        <div
                          key={dayHours.day}
                          className="flex items-center space-x-4"
                        >
                          <div className="w-24">
                            <Label>{dayHours.day}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={dayHours.open}
                              onCheckedChange={(checked) => {
                                const newBusinessHours = [
                                  ...storeSettings.businessHours,
                                ];
                                newBusinessHours[index] = {
                                  ...dayHours,
                                  open: checked,
                                };
                                setStoreSettings({
                                  ...storeSettings,
                                  businessHours: newBusinessHours,
                                });
                              }}
                            />
                            <Label>{dayHours.open ? "Open" : "Closed"}</Label>
                          </div>
                          {dayHours.open && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Label
                                  htmlFor={`openTime-${dayHours.day}`}
                                  className="sr-only"
                                >
                                  Open Time
                                </Label>
                                <Input
                                  id={`openTime-${dayHours.day}`}
                                  type="time"
                                  value={dayHours.openTime}
                                  onChange={(e) => {
                                    const newBusinessHours = [
                                      ...storeSettings.businessHours,
                                    ];
                                    newBusinessHours[index] = {
                                      ...dayHours,
                                      openTime: e.target.value,
                                    };
                                    setStoreSettings({
                                      ...storeSettings,
                                      businessHours: newBusinessHours,
                                    });
                                  }}
                                  className="w-24"
                                />
                              </div>
                              <span>to</span>
                              <div className="flex items-center space-x-2">
                                <Label
                                  htmlFor={`closeTime-${dayHours.day}`}
                                  className="sr-only"
                                >
                                  Close Time
                                </Label>
                                <Input
                                  id={`closeTime-${dayHours.day}`}
                                  type="time"
                                  value={dayHours.closeTime}
                                  onChange={(e) => {
                                    const newBusinessHours = [
                                      ...storeSettings.businessHours,
                                    ];
                                    newBusinessHours[index] = {
                                      ...dayHours,
                                      closeTime: e.target.value,
                                    };
                                    setStoreSettings({
                                      ...storeSettings,
                                      businessHours: newBusinessHours,
                                    });
                                  }}
                                  className="w-24"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveStoreSettings}
                      disabled={isSavingStoreSettings}
                    >
                      {isSavingStoreSettings ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Holiday Mode</CardTitle>
                    <CardDescription>
                      Temporarily disable your store for vacation or other
                      reasons
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Holiday Mode</h3>
                        <p className="text-sm text-muted-foreground">
                          When enabled, your store will not accept new orders,
                          but customers can still browse products.
                        </p>
                      </div>
                      <Switch
                        checked={holidayMode}
                        onCheckedChange={toggleHolidayMode}
                        disabled={isLoading}
                      />
                    </div>

                    {holidayMode && (
                      <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                        <div className="flex items-start">
                          <Calendar className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                          <div>
                            <h4 className="font-medium text-amber-800">
                              Holiday Mode Active
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Your store is currently not accepting new orders.
                              Customers can browse but cannot place orders.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {holidayMode && (
                      <div className="space-y-2">
                        <Label htmlFor="holidayMessage">
                          Holiday Message (Optional)
                        </Label>
                        <Textarea
                          id="holidayMessage"
                          placeholder="Enter a message to display to customers while your store is in holiday mode..."
                          rows={3}
                          defaultValue={settings?.holidayMessage || ""}
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be displayed to customers when they
                          visit your store.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  {holidayMode && (
                    <CardFooter className="flex justify-end">
                      <Button>
                        <Save className="mr-2 h-4 w-4" />
                        Save Message
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>
                      Manage your billing and tax information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN Number</Label>
                      <Input
                        id="gstin"
                        value={billingInfo.gstin}
                        onChange={(e) =>
                          setBillingInfo({
                            ...billingInfo,
                            gstin: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Legal Business Name</Label>
                      <Input
                        id="businessName"
                        value={billingInfo.businessName}
                        onChange={(e) =>
                          setBillingInfo({
                            ...billingInfo,
                            businessName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="panNumber">PAN Number</Label>
                      <Input
                        id="panNumber"
                        value={billingInfo.panNumber}
                        onChange={(e) =>
                          setBillingInfo({
                            ...billingInfo,
                            panNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <RadioGroup
                        value={billingInfo.businessType}
                        onValueChange={(value) =>
                          setBillingInfo({
                            ...billingInfo,
                            businessType: value,
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual">
                            Individual/Proprietorship
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="partnership"
                            id="partnership"
                          />
                          <Label htmlFor="partnership">Partnership</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="company" id="company" />
                          <Label htmlFor="company">
                            Private Limited/Limited Company
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={saveBillingInfo}
                      disabled={isSavingBillingInfo}
                    >
                      {isSavingBillingInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bank Account Information</CardTitle>
                    <CardDescription>
                      Manage your payout details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Holder Name</Label>
                      <Input
                        id="accountName"
                        value={bankInfo.accountName}
                        onChange={(e) =>
                          setBankInfo({
                            ...bankInfo,
                            accountName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={bankInfo.accountNumber}
                          onChange={(e) =>
                            setBankInfo({
                              ...bankInfo,
                              accountNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          value={bankInfo.ifscCode}
                          onChange={(e) =>
                            setBankInfo({
                              ...bankInfo,
                              ifscCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={bankInfo.bankName}
                        onChange={(e) =>
                          setBankInfo({ ...bankInfo, bankName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input
                        id="branchName"
                        value={bankInfo.branchName}
                        onChange={(e) =>
                          setBankInfo({
                            ...bankInfo,
                            branchName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveBankInfo} disabled={isSavingBankInfo}>
                      {isSavingBankInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="pickup_address" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Address</CardTitle>
                    <CardDescription>
                      Set your business pickup address for invoices and shipping
                      labels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={pickupAddress.businessName}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              businessName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={pickupAddress.gstin}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              gstin: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Person</Label>
                        <Input
                          id="contactName"
                          value={pickupAddress.contactName}
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              contactName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupPhone">Phone Number</Label>
                        <Input
                          id="pickupPhone"
                          value={pickupAddress.phone}
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
                            setPickupAddress({
                              ...pickupAddress,
                              phone: value,
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 10-digit number without spaces or special
                          characters
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="authorizationSignature">
                        Authorization Signature
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            id="authorizationSignature"
                            value={pickupAddress.authorizationSignature}
                            onChange={(e) =>
                              setPickupAddress({
                                ...pickupAddress,
                                authorizationSignature: e.target.value,
                              })
                            }
                            placeholder="https://example.com/signature.png"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            or
                          </span>
                          <FileUpload
                            onChange={(url: string) =>
                              setPickupAddress({
                                ...pickupAddress,
                                authorizationSignature: url,
                              })
                            }
                            value={pickupAddress.authorizationSignature}
                            label="Upload Signature"
                            accept="image/*"
                            maxSizeMB={1}
                            id="signature-upload"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Upload your signature image. Max file size: 1MB.
                          Supported formats: JPG, PNG.
                        </div>
                        {pickupAddress.authorizationSignature && (
                          <div className="mt-2 p-2 border rounded-md flex justify-center">
                            <img
                              src={pickupAddress.authorizationSignature}
                              alt="Authorization Signature"
                              className="h-20 w-auto object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/150?text=Signature+Preview")
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="pickupLine1">Address Line 1</Label>
                      <Input
                        id="pickupLine1"
                        value={pickupAddress.line1}
                        onChange={(e) =>
                          setPickupAddress({
                            ...pickupAddress,
                            line1: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupLine2">
                        Address Line 2 (Optional)
                      </Label>
                      <Input
                        id="pickupLine2"
                        value={pickupAddress.line2}
                        onChange={(e) =>
                          setPickupAddress({
                            ...pickupAddress,
                            line2: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="pickupPincode">
                          Pincode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="pickupPincode"
                          value={pickupAddress.pincode}
                          maxLength={6}
                          required
                          onKeyPress={(e) => {
                            // Allow only digits
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={async (e) => {
                            // Only allow digits in the field
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            e.target.value = value;

                            const pincode = value;
                            setPickupAddress({ ...pickupAddress, pincode });
                            console.log("Pickup Pincode changed:", pincode);

                            // If pincode is 6 digits, try to auto-populate city and state
                            if (pincode.length === 6) {
                              console.log(
                                "Fetching data for pickup pincode:",
                                pincode
                              );
                              try {
                                const response = await fetch(
                                  `/api/pincode/${pincode}`
                                );
                                console.log(
                                  "Pickup Pincode API response:",
                                  response.status
                                );
                                if (response.ok) {
                                  const data = await response.json();
                                  console.log(
                                    "Pickup Pincode data received:",
                                    data
                                  );
                                  if (data && data.state) {
                                    console.log(
                                      "Setting pickup address with pincode data:",
                                      data.state,
                                      data.district
                                    );
                                    setPickupAddress((prev) => ({
                                      ...prev,
                                      pincode,
                                      city: data.district || prev.city,
                                      state: data.state || prev.state,
                                    }));
                                    console.log(
                                      "Pickup address state updated:",
                                      pickupAddress.state,
                                      pickupAddress.city
                                    );
                                  }
                                }
                              } catch (error) {
                                console.error(
                                  "Error fetching pincode data:",
                                  error
                                );
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter a 6-digit pincode
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupCity">City/District</Label>
                        <Input
                          id="pickupCity"
                          value={pickupAddress.city}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              city: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pickupState">State</Label>
                        <Input
                          id="pickupState"
                          value={pickupAddress.state}
                          readOnly
                          className="bg-gray-50 cursor-not-allowed"
                          onChange={(e) =>
                            setPickupAddress({
                              ...pickupAddress,
                              state: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-populated from PIN code
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={savePickupAddress}
                      disabled={isSavingPickupAddress}
                    >
                      {isSavingPickupAddress ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Pickup Address
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-medium">Change Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(true)}
                    >
                      Change Password
                    </Button>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="twoFactor" />
                      <Label htmlFor="twoFactor">
                        Enable Two-Factor Authentication
                      </Label>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium">
                        Account Sessions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage active sessions on your account
                      </p>
                    </div>
                    <Button variant="outline">View Active Sessions</Button>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-destructive">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your seller account
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <LogOut className="mr-2 h-4 w-4" />
                          Delete Seller Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your seller account and remove your data from
                            our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your
              credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => changePassword("oldPassword", "newPassword")}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SellerDashboardLayout>
  );
}
