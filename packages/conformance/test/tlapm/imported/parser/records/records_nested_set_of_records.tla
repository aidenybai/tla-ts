(*---
description: The syntax corpus case "Nested Set of Records" in records.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/records.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE records_nested_set_of_records ----
EXTENDS TestPrelude
op == [
  foo : [
    foo : Nat,
    bar : Int,
    baz : Real
  ],
  bar : Int,
  baz : Real
]
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Int, Real
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./records_nested_set_of_records.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./records_nested_set_of_records.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
