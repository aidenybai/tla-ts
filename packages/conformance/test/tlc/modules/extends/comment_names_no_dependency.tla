(*---
description: "A module name inside a comment is not a dependency, so nothing is loaded for it and undefined symbols in it stay unknown."
ref: "tla2sany/parser/TLAplusParser.java#addDependency"
features: [extends]
outcome: parse-error
---*)
---- MODULE comment_names_no_dependency ----
(* EXTENDS FixExtA *)
Test == OnlyA
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 9 to line 9, col 13 of module comment_names_no_dependency
    | Unknown operator: `OnlyA'.
    3002:1 Parsing or semantic analysis failed.
---*)
