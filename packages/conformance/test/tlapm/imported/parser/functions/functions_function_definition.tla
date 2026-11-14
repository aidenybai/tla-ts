(*---
description: The syntax corpus case "Function Definition" in functions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/functions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE functions_function_definition ----
EXTENDS TestPrelude
f1[x \in Nat] == a
f2[x, y \in Nat] == a
f3[x, y \in Nat, z \in Real] == a
f4[x \in [Nat -> Nat]] == a
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Real
VARIABLE a
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./functions_function_definition.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./functions_function_definition.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
