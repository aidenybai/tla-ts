(*---
description: A missing proof is located just after the statement, so --line on the first line of a two-line theorem misses it and the target is empty.
ref: src/tlapm_lib.ml#process_module
args: ["--line", "10"]
mode: obligations
outcome: empty-target
---*)
---- MODULE missing_proof_located_after_statement ----
THEOREM TRUE OBVIOUS
THEOREM
  FALSE
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./missing_proof_located_after_statement.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: No proof obligation found for the selected target.
---*)
