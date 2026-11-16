(*---
description: "An instance's infix operator cannot be written infix, so 1 M!+ 2 is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE infix_through_instance_infix_use ----
M == INSTANCE Naturals
Test == (1 M!+ 2) = 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "M" at line 9, column 12 and token "1" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file infix_through_instance_infix_use
    | In module infix_through_instance_infix_use
    | Could not parse module infix_through_instance_infix_use from file infix_through_instance_infix_use.tla
    | *** Errors: 1
    | In module infix_through_instance_infix_use
    | Could not parse module infix_through_instance_infix_use from file infix_through_instance_infix_use.tla
    3002:1 Parsing or semantic analysis failed.
---*)
