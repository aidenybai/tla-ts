(*---
description: "The first module in a file is the one parsed, so an earlier module makes the root a name mismatch."
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [monolithic]
outcome: parse-error
---*)
---- MODULE Other ----
A == 1
====
---- MODULE module_before_root ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file module_before_root
    | Unknown location
    | File name 'module_before_root' does not match the name 'Other' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'module_before_root' does not match the name 'Other' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)
