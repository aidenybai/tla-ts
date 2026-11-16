(*---
description: Evaluates a random function expression, seed 262, number 4802.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04802 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b7491 \in ((--1) .. IF (1 :> 2) THEN 1 ELSE 1) |-> (CHOOSE b7492 \in UNION {(1 :> 2), SUBSET {1}} : (SUBSET {1} = SUBSET {1}))] EXCEPT ![Cardinality({b7493 \in UNION {{}, 1..3} : (FALSE /\ FALSE)})] = Len(SortSeq(Append(<<1>>, 7), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 32 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 29.
    | Expression starting at line 14, column 29.
    | ExtendableExpr starting at line 14, column 28.
    | Expression starting at line 14, column 28.
    | Quant Bound starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_04802
    | In module random_04802
    | Could not parse module random_04802 from file random_04802.tla
    | *** Errors: 1
    | In module random_04802
    | Could not parse module random_04802 from file random_04802.tla
    3002:1 Parsing or semantic analysis failed.
---*)
