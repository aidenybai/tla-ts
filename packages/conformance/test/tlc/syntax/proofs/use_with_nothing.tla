(*---
description: USE needs a fact or a DEF.
ref: "tla2sany/parser/TLAplusParser.java#UseOrHideOrBy"
features: [proofs]
outcome: parse-error
---*)
---- MODULE use_with_nothing ----
USE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 3 of module use_with_nothing
    | Empty BY, USE, or HIDE
    | line 8, col 1 to line 8, col 3 of module use_with_nothing
    | Empty USE or HIDE statement.
    3002:1 Parsing or semantic analysis failed.
---*)
