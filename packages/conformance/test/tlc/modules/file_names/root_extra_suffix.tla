(*---
description: A root module name with extra characters is rejected.
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [file_names]
outcome: parse-error
---*)
---- MODULE root_extra_suffix2 ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file root_extra_suffix
    | Unknown location
    | File name 'root_extra_suffix' does not match the name 'root_extra_suffix2' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'root_extra_suffix' does not match the name 'root_extra_suffix2' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)
