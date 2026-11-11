(*---
description: A postfix-only token cannot define a prefix operator.
ref: "tla2sany/parser/TLAplusParser.java#OperatorOrFunctionDefinition"
features: [operators]
outcome: parse-error
---*)
---- MODULE define_prefix_as_postfix ----
^+ a == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "^+" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_prefix_as_postfix
    | In module define_prefix_as_postfix
    | Could not parse module define_prefix_as_postfix from file define_prefix_as_postfix.tla
    | *** Errors: 1
    | In module define_prefix_as_postfix
    | Could not parse module define_prefix_as_postfix from file define_prefix_as_postfix.tla
    3002:1 Parsing or semantic analysis failed.
---*)
