import "@/assets/pages/share-manager.less";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  dialogSelector,
  dataSelector,
  syncData,
  deleteData,
} from "@/store/sharing.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { selectAuthenticated, selectInit } from "@/store/auth.ts";
import { useEffectAsync } from "@/utils/hook.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { closeDialog, setDialog } from "@/store/sharing.ts";
import { Button } from "@/components/ui/button.tsx";
import { useMemo } from "react";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { getSharedLink, SharingPreviewForm } from "@/api/sharing.ts";

type ShareTableProps = {
  data: SharingPreviewForm[];
};

function ShareTable({ data }: ShareTableProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const time = useMemo(() => {
    return data.map((row) => {
      const date = new Date(row.time);
      return `${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    });
  }, [data]);

  return (
    <Table className={`mt-5`}>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>{t("share.name")}</TableHead>
          <TableHead>{t("share.time")}</TableHead>
          <TableHead>{t("share.action")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell>{row.conversation_id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell className={`whitespace-nowrap`}>{time[idx]}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={`outline`} size={`icon`}>
                    <MoreHorizontal className={`h-4 w-4`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={`center`}>
                  <DropdownMenuItem
                    onClick={() => {
                      window.open(getSharedLink(row.hash), "_blank");
                    }}
                  >
                    <Eye className={`h-4 w-4 mr-1`} />
                    {t("share.view")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await deleteData(dispatch, row.hash);
                    }}
                  >
                    <Trash2 className={`h-4 w-4 mr-1`} />
                    {t("conversation.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ShareManagementDialog() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const open = useSelector(dialogSelector);
  const data = useSelector(dataSelector);
  const { toast } = useToast();
  const init = useSelector(selectInit);
  const auth = useSelector(selectAuthenticated);

  useEffectAsync(async () => {
    if (init && auth) {
      if (data.length > 0) return;
      const resp = await syncData(dispatch);
      if (resp) {
        toast({
          title: t("share.sync-error"),
          description: resp,
        });
      }
    }
  }, [init, auth]);

  return (
    <Dialog open={open} onOpenChange={(open) => dispatch(setDialog(open))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("share.manage")}</DialogTitle>
          {data.length > 0 ? (
            <DialogDescription className={`share-table`}>
              <ShareTable data={data} />
            </DialogDescription>
          ) : (
            <DialogDescription>
              <p className={`text-center select-none mt-6 mb-2`}>
                {t("conversation.empty")}
              </p>
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant={`outline`} onClick={() => dispatch(closeDialog())}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShareManagementDialog;
