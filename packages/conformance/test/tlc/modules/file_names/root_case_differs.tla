(*---
description: A root module name that differs from the file only by case is rejected.
ref: "tla2sany/modanalyzer/ParseUnit.java#verifyEquivalenceOfFileAndModuleNames"
features: [file_names]
outcome: parse-error
---*)
---- MODULE Root_Case_Differs ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file root_case_differs
    | Unknown location
    | File name 'root_case_differs' does not match the name 'Root_Case_Differs' of the top level module it contains.
    | *** Errors: 1
    | Unknown location
    | File name 'root_case_differs' does not match the name 'Root_Case_Differs' of the top level module it contains.
    3002:1 Parsing or semantic analysis failed.
---*)
