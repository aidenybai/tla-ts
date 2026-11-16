(*---
description: "∀∀ is two ∀ tokens, not \\AA, so it is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#SomeQuant"
features: [unicode]
outcome: parse-error
---*)
---- MODULE double_forall_not_aa ----
VARIABLE x
A == ∀∀ y : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "∀" at line 9, column 7 and token "\u2200" 
    | Residual stack trace follows:
    | Quantified form starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file double_forall_not_aa
    | In module double_forall_not_aa
    | Could not parse module double_forall_not_aa from file double_forall_not_aa.tla
    | *** Errors: 1
    | In module double_forall_not_aa
    | Could not parse module double_forall_not_aa from file double_forall_not_aa.tla
    3002:1 Parsing or semantic analysis failed.
---*)
