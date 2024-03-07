import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectInit } from "@/store/auth.ts";
import { useEffectAsync } from "@/utils/hook.ts";
import {
  BroadcastInfo,
  createBroadcast,
  getBroadcastList,
} from "@/api/broadcast.ts";
import { useTranslation } from "react-i18next";
import { extractMessage } from "@/utils/processor.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Plus, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { DialogClose } from "@radix-ui/react-dialog";

type CreateBroadcastDialogProps = {
  onCreated?: () => void;
};

function CreateBroadcastDialog(props: CreateBroadcastDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  async function postBroadcast() {
    const broadcast = content.trim();
    if (broadcast.length === 0) return;
    const resp = await createBroadcast(broadcast);
    if (resp.status) {
      toast({
        title: t("admin.post-success"),
        description: t("admin.post-success-prompt"),
      });
      setContent("");
      setOpen(false);
      props.onCreated?.();
    } else {
      toast({
        title: t("admin.post-failed"),
        description: t("admin.post-failed-prompt", { reason: resp.error }),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={`default`}>
          <Plus className={`w-4 h-4 mr-1`} />
          {t("admin.create-broadcast")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.create-broadcast")}</DialogTitle>
          <DialogDescription asChild>
            <div className={`pt-4`}>
              <Textarea
                placeholder={t("admin.broadcast-placeholder")}
                value={content}
                rows={5}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={`outline`}>{t("admin.cancel")}</Button>
          </DialogClose>
          <Button variant={`default`} onClick={postBroadcast} loading={true}>
            {t("admin.post")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function BroadcastTable() {
  const { t } = useTranslation();
  const init = useSelector(selectInit);
  const [data, setData] = useState<BroadcastInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffectAsync(async () => {
    if (!init) return;

    setLoading(true);
    setData(await getBroadcastList());
    setLoading(false);
  }, [init]);

  return (
    <div className={`broadcast-table whitespace-nowrap`}>
      <div className={`broadcast-action flex flex-row flex-nowrap w-full mb-4`}>
        <Button
          variant={`outline`}
          size={`icon`}
          onClick={async () => {
            setData(await getBroadcastList());
          }}
        >
          <RotateCcw className={`w-4 h-4`} />
        </Button>
        <div className={`grow`} />
        <CreateBroadcastDialog
          onCreated={async () => setData(await getBroadcastList())}
        />
      </div>
      {data.length ? (
        <Table>
          <TableHeader>
            <TableRow className={`select-none whitespace-nowrap`}>
              <TableHead>ID</TableHead>
              <TableHead>{t("admin.broadcast-content")}</TableHead>
              <TableHead>{t("admin.poster")}</TableHead>
              <TableHead>{t("admin.post-at")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user, idx) => (
              <TableRow key={idx}>
                <TableCell>{user.index}</TableCell>
                <TableCell>{extractMessage(user.content, 25)}</TableCell>
                <TableCell>{user.poster}</TableCell>
                <TableCell>{user.created_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className={`text-center select-none my-8`}>
          {loading ? (
            <Loader2 className={`w-6 h-6 inline-block animate-spin`} />
          ) : (
            <p className={`empty`}>{t("admin.empty")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default BroadcastTable;
