(*---
description: "An instance's postfix operator cannot be written postfix, so 1 M!^+ is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE postfix_through_instance ----
---- MODULE I ----
a ^+ == <<a>>
====
M == INSTANCE I
Test == 1 M!^+ = <<1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "M" at line 12, column 11 and token "1" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file postfix_through_instance
    | In module postfix_through_instance
    | Could not parse module postfix_through_instance from file postfix_through_instance.tla
    | *** Errors: 1
    | In module postfix_through_instance
    | Could not parse module postfix_through_instance from file postfix_through_instance.tla
    3002:1 Parsing or semantic analysis failed.
---*)
