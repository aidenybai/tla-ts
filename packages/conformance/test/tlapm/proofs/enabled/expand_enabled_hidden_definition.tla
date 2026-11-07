(*---
description: ExpandENABLED refuses to expand ENABLED over a hidden definition, and the obligation fails with prover expandenabled and the soundness message as reason.
ref: src/expr/e_action.ml#expand_definition
mode: proof
outcome: failed
---*)
---- MODULE expand_enabled_hidden_definition ----
EXTENDS TLAPS
VARIABLE x, y
A == x' = 1
THEOREM ENABLED A
  BY ExpandENABLED
====

(*--- recorded
all:
  exit: 10
  transcript: "@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: failed\n@prover: expandenabled\n@meth: time-limit: inf\n@reason: Hidden definition of operator `A` needs expansion for soundly expanding the operator `ENABLED` (using rigid quantification).\nThe expansion of the operator `ENABLED` has been activated with the `ExpandENABLED` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 11, character 17\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\n@already: false\n@obl: Hidden definition of operator `A` needs expansion for soundly expanding the operator `ENABLED` (using rigid quantification).\nThe expansion of the operator `ENABLED` has been activated with the `ExpandENABLED` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 11, character 17\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\n\nObligation:\n\nASSUME NEW VARIABLE x,\n       NEW VARIABLE y,\n       TRUE \nPROVE  ENABLED A\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:19\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:19\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./expand_enabled_hidden_definition.tla\", line 11, character 17:\nError: Hidden definition of operator `A` needs expansion for soundly expanding the operator `ENABLED` (using rigid quantification).\nThe expansion of the operator `ENABLED` has been activated with the `ExpandENABLED` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_enabled_hidden_definition.tla\", line 11, character 17\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\nFile \"./expand_enabled_hidden_definition.tla\", line 12, characters 3-4:\n[ERROR]: Could not prove or check:\n           ASSUME NEW VARIABLE x,\n                  NEW VARIABLE y,\n                  ExpandENABLED \n           PROVE  ENABLED A\nFile \"./expand_enabled_hidden_definition.tla\", line 7, character 1 to line 13, character 4:\n[ERROR]: 1/2 obligations failed.\nThere were backend errors processing module `\"expand_enabled_hidden_definition\"`."
---*)
