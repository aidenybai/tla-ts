(*---
description: "- a == ... is not a definition: the prefix form must be spelled -. on the left side."
ref: "tla2sany/parser/TLAplusParser.java#PrefixLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE prefix_minus_define_plain ----
- a == 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "-" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file prefix_minus_define_plain
    | In module prefix_minus_define_plain
    | Could not parse module prefix_minus_define_plain from file prefix_minus_define_plain.tla
    | *** Errors: 1
    | In module prefix_minus_define_plain
    | Could not parse module prefix_minus_define_plain from file prefix_minus_define_plain.tla
    3002:1 Parsing or semantic analysis failed.
---*)
