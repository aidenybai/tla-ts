(*---
description: "∃∃ is two ∃ tokens, not \\EE, so it is a parse error."
ref: "tla2sany/parser/TLAplusParser.java#SomeQuant"
features: [unicode]
outcome: parse-error
---*)
---- MODULE double_exists_not_ee ----
VARIABLE x
A == ∃∃ y : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "∃" at line 9, column 7 and token "\u2203" 
    | Residual stack trace follows:
    | Quantified form starting at line 9, column 6.
    | Expression starting at line 9, column 6.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file double_exists_not_ee
    | In module double_exists_not_ee
    | Could not parse module double_exists_not_ee from file double_exists_not_ee.tla
    | *** Errors: 1
    | In module double_exists_not_ee
    | Could not parse module double_exists_not_ee from file double_exists_not_ee.tla
    3002:1 Parsing or semantic analysis failed.
---*)
