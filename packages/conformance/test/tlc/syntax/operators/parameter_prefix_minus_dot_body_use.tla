(*---
description: "With a -. _ parameter, the body cannot write -. a, since -. is not an expression prefix."
ref: "tla2sany/parser/TLAplusParser.java#PrefixOp"
features: [operators]
outcome: parse-error
---*)
---- MODULE parameter_prefix_minus_dot_body_use ----
Op(-. _, a) == -. a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "a" at line 8, column 19 and token "-." 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file parameter_prefix_minus_dot_body_use
    | In module parameter_prefix_minus_dot_body_use
    | Could not parse module parameter_prefix_minus_dot_body_use from file parameter_prefix_minus_dot_body_use.tla
    | *** Errors: 1
    | In module parameter_prefix_minus_dot_body_use
    | Could not parse module parameter_prefix_minus_dot_body_use from file parameter_prefix_minus_dot_body_use.tla
    3002:1 Parsing or semantic analysis failed.
---*)
