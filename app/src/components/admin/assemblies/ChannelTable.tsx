import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Activity,
  Check,
  Plus,
  RotateCw,
  Settings2,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import OperationAction from "@/components/OperationAction.tsx";
import { Dispatch, useEffect, useMemo, useState } from "react";
import { Channel, getChannelType } from "@/admin/channel.ts";
import { toastState } from "@/admin/utils.ts";
import { useTranslation } from "react-i18next";
import { useEffectAsync } from "@/utils/hook.ts";
import {
  activateChannel,
  deactivateChannel,
  deleteChannel,
  listChannel,
} from "@/admin/api/channel.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { cn } from "@/components/ui/lib/utils.ts";
import PopupDialog from "@/components/PopupDialog.tsx";
import { getApiModels, getV1Path } from "@/api/v1.ts";
import { getHostName } from "@/utils/base.ts";

type ChannelTableProps = {
  display: boolean;
  dispatch: Dispatch<any>;
  setId: (id: number) => void;
  setEnabled: (enabled: boolean) => void;
};

type TypeBadgeProps = {
  type: string;
};

function TypeBadge({ type }: TypeBadgeProps) {
  const content = useMemo(() => getChannelType(type), [type]);

  return (
    <Badge className={`select-none w-max cursor-pointer`}>
      {content || type}
    </Badge>
  );
}

type SyncDialogProps = {
  dispatch: Dispatch<any>;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function SyncDialog({ dispatch, open, setOpen }: SyncDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const submit = async (endpoint: string): Promise<boolean> => {
    endpoint = endpoint.trim();
    endpoint.endsWith("/") && (endpoint = endpoint.slice(0, -1));

    const path = getV1Path("/v1/models", { endpoint });
    const models = await getApiModels({ endpoint });

    if (models.length === 0) {
      toast({
        title: t("admin.channels.sync-failed"),
        description: t("admin.channels.sync-failed-prompt", { endpoint: path }),
      });
      return false;
    }

    const name = getHostName(endpoint).replace(/\./g, "-");
    const data: Channel = {
      id: -1,
      name,
      type: "openai",
      models,
      priority: 0,
      weight: 1,
      retry: 3,
      secret: "",
      endpoint,
      mapper: "",
      state: true,
      group: [],
    };

    dispatch({ type: "set", value: data });
    return true;
  };

  return (
    <PopupDialog
      title={t("admin.channels.joint")}
      name={t("admin.channels.joint-endpoint")}
      placeholder={t("admin.channels.joint-endpoint-placeholder")}
      open={open}
      setOpen={setOpen}
      defaultValue={"https://api.chatnio.net"}
      onSubmit={submit}
    />
  );
}

function ChannelTable({
  display,
  dispatch,
  setId,
  setEnabled,
}: ChannelTableProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [data, setData] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const refresh = async () => {
    setLoading(true);
    const resp = await listChannel();
    setLoading(false);
    if (!resp.status) toastState(toast, t, resp);
    else setData(resp.data);
  };
  useEffectAsync(refresh, []);
  useEffectAsync(refresh, [display]);

  useEffect(() => {
    if (display) setId(-1);
  }, [display]);

  return (
    display && (
      <div>
        <SyncDialog
          open={open}
          setOpen={setOpen}
          dispatch={(action) => {
            dispatch(action);
            setEnabled(true);
            setId(-1);
          }}
        />
        <div className={`flex flex-row w-full h-max`}>
          <Button
            className={`mr-2`}
            onClick={() => {
              setEnabled(true);
              setId(-1);
            }}
          >
            <Plus className={`h-4 w-4 mr-1`} />
            {t("admin.channels.create")}
          </Button>
          <Button
            className={`mr-2`}
            variant={`outline`}
            onClick={() => setOpen(true)}
          >
            <Activity className={`h-4 w-4 mr-1`} />
            {t("admin.channels.joint")}
          </Button>
          <div className={`grow`} />
          <Button
            variant={`outline`}
            size={`icon`}
            className={`mr-2`}
            onClick={refresh}
          >
            <RotateCw className={cn(`h-4 w-4`, loading && `animate-spin`)} />
          </Button>
        </div>
        <Table className={`channel-table mt-4`}>
          <TableHeader>
            <TableRow className={`select-none whitespace-nowrap`}>
              <TableCell>{t("admin.channels.id")}</TableCell>
              <TableCell>{t("admin.channels.name")}</TableCell>
              <TableCell>{t("admin.channels.type")}</TableCell>
              <TableCell>{t("admin.channels.priority")}</TableCell>
              <TableCell>{t("admin.channels.weight")}</TableCell>
              <TableCell>{t("admin.channels.state")}</TableCell>
              <TableCell>{t("admin.channels.action")}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data || []).map((chan, idx) => (
              <TableRow key={idx}>
                <TableCell className={`channel-id select-none`}>
                  #{chan.id}
                </TableCell>
                <TableCell>{chan.name}</TableCell>
                <TableCell>
                  <TypeBadge type={chan.type} />
                </TableCell>
                <TableCell>{chan.priority}</TableCell>
                <TableCell>{chan.weight}</TableCell>
                <TableCell>
                  {chan.state ? (
                    <Check className={`h-4 w-4 text-green-500`} />
                  ) : (
                    <X className={`h-4 w-4 text-destructive`} />
                  )}
                </TableCell>
                <TableCell className={`flex flex-row flex-wrap gap-2`}>
                  <OperationAction
                    tooltip={t("admin.channels.edit")}
                    onClick={() => {
                      setEnabled(true);
                      setId(chan.id);
                    }}
                  >
                    <Settings2 className={`h-4 w-4`} />
                  </OperationAction>
                  {chan.state ? (
                    <OperationAction
                      tooltip={t("admin.channels.disable")}
                      variant={`destructive`}
                      onClick={async () => {
                        const resp = await deactivateChannel(chan.id);
                        toastState(toast, t, resp, true);
                        await refresh();
                      }}
                    >
                      <X className={`h-4 w-4`} />
                    </OperationAction>
                  ) : (
                    <OperationAction
                      tooltip={t("admin.channels.enable")}
                      onClick={async () => {
                        const resp = await activateChannel(chan.id);
                        toastState(toast, t, resp, true);
                        await refresh();
                      }}
                    >
                      <Check className={`h-4 w-4`} />
                    </OperationAction>
                  )}
                  <OperationAction
                    tooltip={t("admin.channels.delete")}
                    variant={`destructive`}
                    onClick={async () => {
                      const resp = await deleteChannel(chan.id);
                      toastState(toast, t, resp, true);
                      await refresh();
                    }}
                  >
                    <Trash className={`h-4 w-4`} />
                  </OperationAction>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  );
}

export default ChannelTable;
