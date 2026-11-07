(*---
description: The syntax corpus case "Function Literal with Multiple Parameters and Jlist" in functions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/functions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE functions_function_literal_with_multiple_parameters_and_jlist ----
EXTENDS TestPrelude
op == [
  x, y \in Nat, <<a, b>> \in
    /\ A
    /\ B
      |->
        /\ A
        /\ B
            ]
====
---- MODULE TestPrelude ----
CONSTANT Nat
VARIABLES A, B
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./functions_function_literal_with_multiple_parameters_and_jlist.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./functions_function_literal_with_multiple_parameters_and_jlist.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
