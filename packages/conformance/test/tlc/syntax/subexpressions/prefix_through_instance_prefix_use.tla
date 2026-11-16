(*---
description: "An instance's prefix operator cannot be written prefix, so M!-. 1 is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
outcome: parse-error
---*)
---- MODULE prefix_through_instance_prefix_use ----
---- MODULE I ----
-. a == <<a, a>>
====
M == INSTANCE I
Test == M!-. 1 = <<1, 1>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "1" at line 12, column 14 and token "-." 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file prefix_through_instance_prefix_use
    | In module prefix_through_instance_prefix_use
    | Could not parse module prefix_through_instance_prefix_use from file prefix_through_instance_prefix_use.tla
    | *** Errors: 1
    | In module prefix_through_instance_prefix_use
    | Could not parse module prefix_through_instance_prefix_use from file prefix_through_instance_prefix_use.tla
    3002:1 Parsing or semantic analysis failed.
---*)
