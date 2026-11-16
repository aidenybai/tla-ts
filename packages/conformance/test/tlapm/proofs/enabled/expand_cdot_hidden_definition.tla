(*---
description: ExpandCdot refuses a hidden definition inside \cdot and names ExpandCdot in its message.
ref: src/expr/e_action.ml#expand_definition
mode: proof
outcome: failed
---*)
---- MODULE expand_cdot_hidden_definition ----
EXTENDS TLAPS
VARIABLE x, y
A == x' = 2
THEOREM (A \cdot A) => TRUE
  BY ExpandCdot
====

(*--- recorded
all:
  exit: 10
  transcript: "@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: to be proved\n\n@type: obligation\n@id: 1\n@loc: 12:3:12:5\n@status: failed\n@prover: expandcdot\n@meth: time-limit: inf\n@reason: Hidden definition of operator `A` needs expansion for soundly expanding the operator `\\cdot` (using rigid quantification).\nThe expansion of the operator `\\cdot` has been activated with the `ExpandCdot` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 11, character 10\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\n@already: false\n@obl: Hidden definition of operator `A` needs expansion for soundly expanding the operator `\\cdot` (using rigid quantification).\nThe expansion of the operator `\\cdot` has been activated with the `ExpandCdot` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 11, character 10\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\n\nObligation:\n\nASSUME NEW VARIABLE x,\n       NEW VARIABLE y,\n       TRUE \nPROVE  A \\cdot A => TRUE\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:16\n@status: to be proved\n\n@type: obligation\n@id: 2\n@loc: 12:6:12:16\n@status: trivial\n@prover: tlapm\n@already: false\n\n@type: obligationsnumber\n@count: 2\n\nFile \"./expand_cdot_hidden_definition.tla\", line 11, character 10:\nError: Hidden definition of operator `A` needs expansion for soundly expanding the operator `\\cdot` (using rigid quantification).\nThe expansion of the operator `\\cdot` has been activated with the `ExpandCdot` proof directive from the module `TLAPS`.\nThe operator `A` is defined at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 10, characters 6-11\nand the operator `A` occurs at: \n\tFile \"./expand_cdot_hidden_definition.tla\", line 11, character 10\nUsing the proof directive `AutoUSE` from the module `TLAPS`, or `BY DEF A` is expected to avoid this error.\nFile \"./expand_cdot_hidden_definition.tla\", line 12, characters 3-4:\n[ERROR]: Could not prove or check:\n           ASSUME NEW VARIABLE x,\n                  NEW VARIABLE y,\n                  ExpandCdot \n           PROVE  A \\cdot A => TRUE\nFile \"./expand_cdot_hidden_definition.tla\", line 7, character 1 to line 13, character 4:\n[ERROR]: 1/2 obligations failed.\nThere were backend errors processing module `\"expand_cdot_hidden_definition\"`."
---*)
