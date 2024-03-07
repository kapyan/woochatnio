import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useTranslation } from "react-i18next";
import { Dispatch, useMemo, useReducer, useState } from "react";
import { Model as RawModel } from "@/api/types.ts";
import { allModels, supportModels } from "@/conf";
import { Input } from "@/components/ui/input.tsx";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { generateRandomChar, isUrl, resetJsArray } from "@/utils/base.ts";
import Require from "@/components/Require.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import Tips from "@/components/Tips.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Toggle } from "@/components/ui/toggle.tsx";
import { marketEditableTags, modelImages } from "@/admin/market.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { updateMarket } from "@/admin/api/market.ts";
import { Combobox } from "@/components/ui/combo-box.tsx";
import { channelModels } from "@/admin/channel.ts";
import { cn } from "@/components/ui/lib/utils.ts";
import { marketEvent } from "@/events/market.ts";
import PopupDialog from "@/components/PopupDialog.tsx";
import {
  getApiCharge,
  getApiMarket,
  getApiModels,
  getV1Path,
} from "@/api/v1.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { ChargeProps, nonBilling } from "@/admin/charge.ts";
import { loadPreferenceModels } from "@/conf/storage.ts";
import { selectModel, setModel, setModelList } from "@/store/chat.ts";
import { useDispatch, useSelector } from "react-redux";

type Model = RawModel & {
  seed?: string;
};

type MarketForm = Model[];

const generateSeed = () => generateRandomChar(8);

function reducer(state: MarketForm, action: any): MarketForm {
  switch (action.type) {
    case "set":
      return [
        ...action.payload.map((model: RawModel) => ({
          ...model,
          seed: generateSeed(),
        })),
      ];
    case "add":
      return [
        ...state,
        {
          ...action.payload,
          seed: generateSeed(),
        },
      ];
    case "add-multiple":
      return [
        ...state,
        ...action.payload.map((model: RawModel) => ({
          id: model.id || "",
          name: model.name || "",
          free: false,
          auth: false,
          description: model.description || "",
          high_context: model.high_context || false,
          default: model.default || false,
          tag: model.tag || [],
          avatar: model.avatar || modelImages[0],
          seed: generateSeed(),
        })),
      ];
    case "new":
      return [
        ...state,
        {
          id: "",
          name: "",
          free: false,
          auth: false,
          description: "",
          high_context: false,
          default: false,
          tag: [],
          avatar: modelImages[0],
          seed: generateSeed(),
        },
      ];
    case "remove":
      let { idx } = action.payload;
      return [...state.slice(0, idx), ...state.slice(idx + 1)];
    case "update":
      let { index, data } = action.payload;
      return [...state.slice(0, index), data, ...state.slice(index + 1)];
    case "update-id":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, id: action.payload.id };
          }
          return model;
        }),
      ];
    case "update-name":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, name: action.payload.name };
          }
          return model;
        }),
      ];
    case "update-description":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, description: action.payload.description };
          }
          return model;
        }),
      ];
    case "update-context":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, high_context: action.payload.context };
          }
          return model;
        }),
      ];
    case "update-default":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, default: action.payload.default };
          }
          return model;
        }),
      ];
    case "update-tags":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, tag: action.payload.tags };
          }
          return model;
        }),
      ];
    case "add-tag":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            const tag = model.tag || [];
            tag.push(action.payload.tag);
            return {
              ...model,
              tag: [...tag],
            };
          }
          return model;
        }),
      ];
    case "remove-tag":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            const tag = model.tag || [];
            return {
              ...model,
              tag: tag.filter((t) => t !== action.payload.tag),
            };
          }
          return model;
        }),
      ];
    case "set-avatar":
      return [
        ...state.map((model, idx) => {
          if (idx === action.payload.idx) {
            return { ...model, avatar: action.payload.avatar };
          }
          return model;
        }),
      ];
    case "replace":
      const { from, to } = action.payload;
      const [removed] = state.splice(from, 1);
      state.splice(to, 0, removed);
      return [...state];
    case "upward":
      if (action.payload.idx === 0) return state;
      const upward = state[action.payload.idx];
      state[action.payload.idx] = state[action.payload.idx - 1];
      state[action.payload.idx - 1] = upward;
      return [...state];
    case "downward":
      if (action.payload.idx === state.length - 1) return state;
      const downward = state[action.payload.idx];
      state[action.payload.idx] = state[action.payload.idx + 1];
      state[action.payload.idx + 1] = downward;
      return [...state];
    default:
      throw new Error();
  }
}

type MarketTagsProps = {
  tag: string[] | undefined;
  idx: number;
  dispatch: Dispatch<any>;
};

function MarketTags({ tag, idx, dispatch }: MarketTagsProps) {
  const { t } = useTranslation();
  const tags = useMemo((): Record<string, boolean> => {
    const selected = tag || [];

    return marketEditableTags.reduce(
      (acc, name) => {
        acc[name] = selected.includes(name);
        return acc;
      },
      {} as Record<string, boolean>,
    );
  }, [tag]);

  return (
    <div className={`market-tags`}>
      {tags &&
        Object.keys(tags).map((name) => (
          <Toggle
            key={name}
            variant={`outline`}
            size={`sm`}
            pressed={tags[name]}
            className={`market-tag`}
            onPressedChange={(state) => {
              dispatch({
                type: state ? "add-tag" : "remove-tag",
                payload: {
                  idx,
                  tag: name,
                },
              });
            }}
          >
            {t(`tag.${name}`)}
          </Toggle>
        ))}
    </div>
  );
}

type MarketImageProps = {
  image: string;
  idx: number;
  dispatch: Dispatch<any>;
};

function MarketImage({ image, idx, dispatch }: MarketImageProps) {
  const { t } = useTranslation();

  const [customized, setCustomized] = useState<boolean>(false);
  const [customizedImage, setCustomizedImage] = useState<string>("");

  const targetImages = useMemo((): string[] => {
    return customized ? [...modelImages, image] : modelImages;
  }, [customized, image]);

  const setAvatar = (source: string) =>
    dispatch({
      type: "set-avatar",
      payload: {
        idx,
        avatar: source,
      },
    });

  return (
    <div className={`market-image-wrapper`}>
      <div className={`market-images`}>
        {targetImages.map((source) => (
          <Toggle
            key={source}
            variant={`outline`}
            size={`sm`}
            pressed={source === image}
            className={cn("market-image", source === image ? "active" : "")}
            onPressedChange={(state) => {
              if (!state) return;
              if (customized) {
                setCustomized(false);
              }
              setAvatar(source);
            }}
          >
            {source ? (
              <img
                src={isUrl(source) ? customizedImage : `/icons/${source}`}
                alt={source}
              />
            ) : (
              <HelpCircle className={`h-6 w-6`} />
            )}
          </Toggle>
        ))}
      </div>
      <div className={`market-custom-image`}>
        <div className={`market-checkbox`}>
          <Checkbox
            checked={customized}
            onCheckedChange={(raw) => {
              const state = !!raw;
              setCustomized(state);
              setAvatar(state ? customizedImage : modelImages[0]);
            }}
          />
          {t("admin.market.custom-image")}
        </div>
        <Input
          value={customizedImage}
          placeholder={t("admin.market.custom-image-placeholder")}
          onChange={(e) => {
            setCustomizedImage(e.target.value);
            setAvatar(e.target.value);
          }}
          disabled={!customized}
        />
      </div>
    </div>
  );
}

type MarketItemProps = {
  model: Model;
  form: MarketForm;
  dispatch: Dispatch<any>;
  index: number;
};

function MarketItem({ model, form, dispatch, index }: MarketItemProps) {
  const { t } = useTranslation();

  const checked = useMemo(
    (): boolean => model.id.trim().length > 0 && model.name.trim().length > 0,
    [model],
  );

  return (
    <div className={cn("market-item", !checked && "error")}>
      <div className={`model-wrapper`}>
        <div className={`market-row`}>
          <span>
            <Require />
            {t("admin.market.model-name")}
          </span>
          <Input
            value={model.name}
            placeholder={t("admin.market.model-name-placeholder")}
            onChange={(e) => {
              dispatch({
                type: "update-name",
                payload: {
                  idx: index,
                  name: e.target.value,
                },
              });
            }}
          />
        </div>
        <div className={`market-row`}>
          <span>
            <Require />
            {t("admin.market.model-id")}
          </span>
          <Combobox
            value={model.id}
            onChange={(id: string) => {
              dispatch({
                type: "update-id",
                payload: { idx: index, id },
              });
            }}
            className={`model-combobox`}
            list={channelModels}
            placeholder={t("admin.market.model-id-placeholder")}
          />
        </div>
        <div className={`market-row`}>
          <span>{t("admin.market.model-description")}</span>
          <Textarea
            value={model.description || ""}
            placeholder={t("admin.market.model-description-placeholder")}
            onChange={(e) => {
              dispatch({
                type: "update-description",
                payload: {
                  idx: index,
                  description: e.target.value,
                },
              });
            }}
          />
        </div>
        <div className={`market-row`}>
          <span>
            {t("admin.market.model-context")}
            <Tips content={t("admin.market.model-context-tip")} />
          </span>
          <Switch
            className={`ml-auto`}
            checked={model.high_context}
            onCheckedChange={(state) => {
              dispatch({
                type: "update-context",
                payload: {
                  idx: index,
                  context: state,
                },
              });
            }}
          />
        </div>
        <div className={`market-row`}>
          <span>
            {t("admin.market.model-is-default")}
            <Tips content={t("admin.market.model-is-default-tip")} />
          </span>
          <Switch
            className={`ml-auto`}
            checked={model.default}
            onCheckedChange={(state) => {
              dispatch({
                type: "update-default",
                payload: {
                  idx: index,
                  default: state,
                },
              });
            }}
          />
        </div>
        <div className={`market-row`}>
          <span>{t("admin.market.model-tag")}</span>
          <MarketTags tag={model.tag} idx={index} dispatch={dispatch} />
        </div>
        <div className={`market-row`}>
          <span>{t("admin.market.model-image")}</span>
          <MarketImage image={model.avatar} idx={index} dispatch={dispatch} />
        </div>
        <div className={`market-row`}>
          <div className={`grow`} />
          <Button
            size={`icon`}
            variant={`outline`}
            onClick={() =>
              dispatch({
                type: "upward",
                payload: { idx: index },
              })
            }
            disabled={index === 0}
          >
            <ChevronUp className={`h-4 w-4`} />
          </Button>
          <Button
            size={`icon`}
            variant={`outline`}
            onClick={() =>
              dispatch({
                type: "downward",
                payload: { idx: index },
              })
            }
            disabled={index === form.length - 1}
          >
            <ChevronDown className={`h-4 w-4`} />
          </Button>
          <Button
            size={`icon`}
            onClick={() =>
              dispatch({
                type: "remove",
                payload: { idx: index },
              })
            }
          >
            <Trash2 className={`h-4 w-4`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

type SyncDialogProps = {
  open: boolean;
  setOpen: (state: boolean) => void;
  onConfirm: (form: MarketForm) => Promise<boolean>;
};

function SyncDialog({ open, setOpen, onConfirm }: SyncDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MarketForm>([]);
  const { toast } = useToast();

  const siteModels = useMemo(
    (): string[] => form.map((model) => model.id),
    [form],
  );
  const existModels = useMemo(
    (): string[] =>
      supportModels
        .filter((model) => siteModels.includes(model.id))
        .map((model) => model.id),
    [siteModels, supportModels],
  );
  const newModels = useMemo(
    (): string[] => siteModels.filter((model) => !existModels.includes(model)),
    [siteModels, existModels],
  );
  const newSupportedModels = useMemo(
    (): string[] => newModels.filter((model) => allModels.includes(model)),
    [newModels, allModels],
  );

  return (
    <>
      <Dialog
        open={form.length > 0}
        onOpenChange={(open: boolean) => {
          if (open) return;
          setOpen(false);
          setForm([]);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.market.sync-option")}</DialogTitle>
            <DialogDescription>
              {t("admin.market.sync-items", {
                length: siteModels.length,
                exist: existModels.length,
                new: newModels.length,
                support: newSupportedModels.length,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={`outline`}
              loading={true}
              onClick={async () => {
                const target = form.filter((model) =>
                  newModels.includes(model.id),
                );
                if (await onConfirm(target)) {
                  setForm([]);
                  setOpen(false);
                }
              }}
              disabled={newModels.length === 0}
            >
              {t("admin.market.sync-all", { length: newModels.length })}
            </Button>
            <Button
              loading={true}
              onClick={async () => {
                const target = form.filter((model) =>
                  newSupportedModels.includes(model.id),
                );
                if (await onConfirm(target)) {
                  setForm([]);
                  setOpen(false);
                }
              }}
              disabled={newSupportedModels.length === 0}
            >
              {t("admin.market.sync-self", {
                length: newSupportedModels.length,
              })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PopupDialog
        title={t("admin.market.sync")}
        name={t("admin.market.sync-site")}
        placeholder={t("admin.market.sync-placeholder")}
        open={open}
        setOpen={setOpen}
        defaultValue={"https://api.chatnio.net"}
        onSubmit={async (endpoint: string) => {
          const raw = getV1Path("/v1/market", { endpoint });
          const resp = await getApiMarket({ endpoint });
          if (resp.length === 0) {
            toast({
              title: t("admin.market.sync-failed"),
              description: t("admin.market.sync-failed-prompt", {
                endpoint: raw,
              }),
            });
            return false;
          }

          setForm(resp);
          return false;
        }}
      />
    </>
  );
}

function Market() {
  const { t } = useTranslation();
  const [form, dispatch] = useReducer(reducer, supportModels);
  const [loading, setLoading] = useState<boolean>(false);

  const model = useSelector(selectModel);

  const globalDispatch = useDispatch();

  const sync = async (): Promise<void> => {
    const market = await getApiMarket();
    const charge = await getApiCharge();

    market.forEach((item: Model) => {
      const obj = charge.find((i: ChargeProps) => i.models.includes(item.id));
      if (!obj) return;

      item.free = obj.type === nonBilling;
      item.auth = !item.free || !obj.anonymous;
    });

    resetJsArray(supportModels, loadPreferenceModels(market));
    resetJsArray(
      allModels,
      supportModels.map((model) => model.id),
    );
    globalDispatch(setModelList(supportModels));
    allModels.length > 0 &&
      !allModels.includes(model) &&
      globalDispatch(setModel(allModels[0]));

    const models = await getApiModels();
    models.forEach((model: string) => {
      if (!allModels.includes(model)) allModels.push(model);
      if (!channelModels.includes(model)) channelModels.push(model);
    });
  };

  const update = async (): Promise<void> => {
    const preflight = form.filter(
      (model) => model.id.trim().length > 0 && model.name.trim().length > 0,
    );
    const resp = await updateMarket(preflight);

    if (!resp.status) {
      toast(t("admin.market.update-failed"), {
        description: t("admin.market.update-failed-prompt", {
          reason: resp.error,
        }),
      });
      return;
    }

    toast(t("admin.market.update-success"), {
      description: t("admin.market.update-success-prompt"),
    });
    await sync();
  };

  const migrate = async (data: RawModel[]): Promise<void> => {
    if (data.length === 0) return;
    dispatch({ type: "add-multiple", payload: [...data] });
  };

  marketEvent.addEventListener((state: boolean) => {
    setLoading(!state);
    !state && dispatch({ type: "set", payload: [...supportModels] });
  });

  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className={`market`}>
      <SyncDialog
        open={open}
        setOpen={setOpen}
        onConfirm={async (data: MarketForm) => {
          await migrate(data);
          toast(t("admin.market.sync-success"), {
            description: t("admin.market.sync-success-prompt", {
              length: data.length,
            }),
          });

          return true;
        }}
      />
      <Card className={`admin-card market-card`}>
        <CardHeader className={`flex flex-row items-center select-none`}>
          <CardTitle>
            {t("admin.market.title")}
            {loading && (
              <Loader2
                className={`inline-block h-4 w-4 ml-2 animate-spin relative top-[-2px]`}
              />
            )}
          </CardTitle>
          <Button
            className={`ml-auto mt-0 whitespace-nowrap`}
            size={`sm`}
            style={{ marginTop: 0 }}
            onClick={() => setOpen(true)}
          >
            {t("admin.market.sync")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className={`market-list`}>
            {form.length > 0 ? (
              form.map((model, index) => (
                <MarketItem
                  key={index}
                  model={model}
                  form={form}
                  dispatch={dispatch}
                  index={index}
                />
              ))
            ) : (
              <p className={`align-center text-sm empty`}>{t("admin.empty")}</p>
            )}
          </div>
          <div className={`market-footer flex flex-row items-center mt-4`}>
            <div className={`grow`} />
            <Button
              size={`sm`}
              variant={`outline`}
              className={`mr-2`}
              onClick={() => dispatch({ type: "new" })}
            >
              <Plus className={`h-4 w-4 mr-2`} />
              {t("admin.market.new-model")}
            </Button>
            <Button size={`sm`} onClick={update} loading={true}>
              {t("admin.market.migrate")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Market;
