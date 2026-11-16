(*---
description: Evaluates a random int expression, seed 262, number 9460.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09460 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14695 \in ({(b14696 \div b14696) : b14696 \in (1..3 \ {1, 2})} \ {LET b14697 == 0 IN 1, (--1)}) : ((\A b14698 \in (3 \in SUBSET {1}) : (FALSE /\ TRUE)) <=> (((1 :> 2))[[a |-> 1, b |-> TRUE]] = (3 + 2)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 116 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 113.
    | Some { } form starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 36.
    | Fatal errors while parsing TLA+ spec in file random_09460
    | In module random_09460
    | Could not parse module random_09460 from file random_09460.tla
    | *** Errors: 1
    | In module random_09460
    | Could not parse module random_09460 from file random_09460.tla
    3002:1 Parsing or semantic analysis failed.
---*)
