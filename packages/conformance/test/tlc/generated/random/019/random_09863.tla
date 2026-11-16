(*---
description: Evaluates a random function expression, seed 262, number 9863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) EXCEPT ![([b15319 \in {0, 1} |-> (b15319 % 7)])[((--1) - (<<5, 6>>)[7])]] = (((CHOOSE b15320 \in Nat : TRUE) * CASE 7 -> 2147483647 [] OTHER -> -1) * (Cardinality({}) :> (CHOOSE b15321 \in SUBSET {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 111 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Expression starting at line 14, column 107.
    | Some [] Form starting at line 14, column 106.
    | Fatal errors while parsing TLA+ spec in file random_09863
    | In module random_09863
    | Could not parse module random_09863 from file random_09863.tla
    | *** Errors: 1
    | In module random_09863
    | Could not parse module random_09863 from file random_09863.tla
    3002:1 Parsing or semantic analysis failed.
---*)
