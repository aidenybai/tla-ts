(*---
description: The syntax corpus case "Jlist Inside Function Evaluation" in functions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/functions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE functions_jlist_inside_function_evaluation ----
EXTENDS TestPrelude
op ==
    /\ 1
    /\ f[
        \/ 2
        \/ 3,
        /\ 4
          ]
====
---- MODULE TestPrelude ----
VARIABLE f
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./functions_jlist_inside_function_evaluation.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./functions_jlist_inside_function_evaluation.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
