(*---
description: A definition from a same-named module in the root file is absent when the standard module wins.
ref: "util/FileUtil.java#createNamedInputStream"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE standard_module_wins_name_absent ----
EXTENDS Naturals
ASSUME FromPost = 1
====
---- MODULE Naturals ----
FromPost == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 8 to line 9, col 15 of module standard_module_wins_name_absent
    | Unknown operator: `FromPost'.
    3002:1 Parsing or semantic analysis failed.
---*)
