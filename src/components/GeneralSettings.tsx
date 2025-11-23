import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { FileText, Zap, Shield } from "lucide-react";

interface GeneralSettingsState {
  ragEnabled: boolean;
  autoSave: boolean;
  confirmDelete: boolean;
}

export const GeneralSettings = () => {
  const [settings, setSettings] = useState<GeneralSettingsState>({
    ragEnabled: true,
    autoSave: true,
    confirmDelete: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("chatbotx-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ragEnabled: parsed.ragEnabled ?? true,
          autoSave: parsed.autoSave ?? true,
          confirmDelete: parsed.confirmDelete ?? true,
        });
      } catch (error) {
        console.error("Failed to parse settings:", error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatbotx-settings", JSON.stringify(settings));
  }, [settings]);

  const handleToggle = (key: keyof GeneralSettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card className="border-border/50">
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            General Settings
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Customize your ChatBotX experience
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          {/* RAG Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor="rag-toggle"
                    className="text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    Enable RAG (Retrieval-Augmented Generation)
                  </Label>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    Enhance AI responses with uploaded document context
                  </p>
                </div>
              </div>
              <Switch
                id="rag-toggle"
                checked={settings.ragEnabled}
                onCheckedChange={() => handleToggle("ragEnabled")}
                className="flex-shrink-0"
              />
            </div>
            {!settings.ragEnabled && (
              <div className="ml-6 p-2 bg-muted/50 border border-border/50 rounded text-[10px] sm:text-xs text-muted-foreground">
                ⚠️ RAG is globally disabled. Document uploads will not affect responses.
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="autosave-toggle"
                  className="text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Auto-save sessions
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Automatically save chat sessions to local storage
                </p>
              </div>
            </div>
            <Switch
              id="autosave-toggle"
              checked={settings.autoSave}
              onCheckedChange={() => handleToggle("autoSave")}
              className="flex-shrink-0"
            />
          </div>

          <Separator className="my-2" />

          {/* Confirm Delete Toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Shield className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="confirm-delete-toggle"
                  className="text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Confirm before delete
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Show confirmation dialog when deleting sessions
                </p>
              </div>
            </div>
            <Switch
              id="confirm-delete-toggle"
              checked={settings.confirmDelete}
              onCheckedChange={() => handleToggle("confirmDelete")}
              className="flex-shrink-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2">
            <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> When RAG is enabled, you can upload documents
                (PDF, TXT, Markdown) to provide context for AI responses. The toggle in the chat
                header allows per-session control.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
