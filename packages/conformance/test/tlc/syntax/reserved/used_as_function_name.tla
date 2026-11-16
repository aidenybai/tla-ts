(*---
description: A reserved word cannot name a function definition.
ref: "tla2sany/parser/TLAplusParser.java#OperatorOrFunctionDefinition"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_function_name ----
STATE[x \in {1}] == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "STATE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_function_name
    | In module used_as_function_name
    | Could not parse module used_as_function_name from file used_as_function_name.tla
    | *** Errors: 1
    | In module used_as_function_name
    | Could not parse module used_as_function_name from file used_as_function_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
