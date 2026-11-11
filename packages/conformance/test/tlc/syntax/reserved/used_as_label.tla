(*---
description: A reserved word cannot be a label.
ref: "tla2sany/parser/TLAplusParser.java#isLabel"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_label ----
Test == IF:: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "::" at line 8, column 11 and token "IF" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 11.
    | Expression starting at line 8, column 11.
    | IF THEN ELSE starting at line 8, column 9.
    | Expression starting at line 8, column 9.
    | Definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_label
    | In module used_as_label
    | Could not parse module used_as_label from file used_as_label.tla
    | *** Errors: 1
    | In module used_as_label
    | Could not parse module used_as_label from file used_as_label.tla
    3002:1 Parsing or semantic analysis failed.
---*)
