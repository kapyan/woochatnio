package skylark

import (
	"chat/globals"
	"chat/utils"
	structpb "github.com/golang/protobuf/ptypes/struct"
	"github.com/volcengine/volc-sdk-golang/service/maas/models/api"
)

func getFunctionCall(calls *globals.ToolCalls) *api.FunctionCall {
	if calls == nil || len(*calls) == 0 {
		return nil
	}

	call := (*calls)[0]
	return &api.FunctionCall{
		Name:      call.Function.Name,
		Arguments: call.Function.Arguments,
	}
}

func getValue(p globals.ToolProperty) *structpb.Value {
	switch p.Type {
	case "string", "enum":
		return &structpb.Value{Kind: &structpb.Value_StringValue{StringValue: p.Description}}
	case "number":
		return &structpb.Value{Kind: &structpb.Value_NumberValue{NumberValue: 0}}
	case "boolean":
		return &structpb.Value{Kind: &structpb.Value_BoolValue{BoolValue: false}}
	case "object":
		return &structpb.Value{Kind: &structpb.Value_StructValue{StructValue: &structpb.Struct{Fields: map[string]*structpb.Value{}}}}
	case "array":
		return &structpb.Value{Kind: &structpb.Value_ListValue{ListValue: &structpb.ListValue{Values: []*structpb.Value{}}}}
	default:
		return nil
	}
}

func getFunctions(tools *globals.FunctionTools) []*api.Function {
	if tools == nil || len(*tools) == 0 {
		return nil
	}

	return utils.Each[globals.ToolObject, *api.Function](*tools, func(tool globals.ToolObject) *api.Function {
		param := &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}
		for k, v := range tool.Function.Parameters.Properties {
			param.Fields[k] = getValue(v)
		}

		return &api.Function{
			Name:        tool.Function.Name,
			Description: tool.Function.Description,
			Parameters:  param,
		}
	})
}
