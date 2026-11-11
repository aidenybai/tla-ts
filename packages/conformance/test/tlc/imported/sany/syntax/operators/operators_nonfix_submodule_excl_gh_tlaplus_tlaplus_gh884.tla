(*---
description: "Nonfix Submodule Excl (GH tlaplus/tlaplus #GH884). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/operators.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884 ----
op == A!B!!!(x,y)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "!" at line 9, column 12 and token "!!" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 12.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884
    | In module operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884
    | Could not parse module operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884 from file operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla
    | *** Errors: 1
    | In module operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884
    | Could not parse module operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884 from file operators_nonfix_submodule_excl_gh_tlaplus_tlaplus_gh884.tla
    3002:1 Parsing or semantic analysis failed.
---*)
