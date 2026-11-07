(*---
description: Proof with Variety of Step Types. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/proofs.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE proofs_proof_with_variety_of_step_types ----
THEOREM TRUE
<1>a..... op == 1
<1>b..... DEFINE op2 == 2
<1>c..... HAVE 3
<1>d..... WITNESS 2, 3
<1>e..... TAKE a, b, c
<1>f..... <1>a
<1>g..... SUFFICES 5
<1>h..... CASE 6
<1>i..... PICK a, b, c : 7
<1>j..... HIDE 8
<1>k..... USE 9
<1>m..... QED
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 15, col 11 to line 15, col 14 of module proofs_proof_with_variety_of_step_types
    | Step number of non-expression step used as an expression.
    | line 18, col 16 to line 18, col 16 of module proofs_proof_with_variety_of_step_types
    | Multiply-defined symbol 'a': this definition or declaration conflicts 
    | with the one at line 14, col 16 to line 14, col 16 of module proofs_proof_with_variety_of_step_types.
    | line 18, col 19 to line 18, col 19 of module proofs_proof_with_variety_of_step_types
    | Multiply-defined symbol 'b': this definition or declaration conflicts 
    | with the one at line 14, col 19 to line 14, col 19 of module proofs_proof_with_variety_of_step_types.
    | line 18, col 22 to line 18, col 22 of module proofs_proof_with_variety_of_step_types
    | Multiply-defined symbol 'c': this definition or declaration conflicts 
    | with the one at line 14, col 22 to line 14, col 22 of module proofs_proof_with_variety_of_step_types.
    3002:1 Parsing or semantic analysis failed.
---*)
