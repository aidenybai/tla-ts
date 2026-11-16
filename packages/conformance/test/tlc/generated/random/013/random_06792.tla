(*---
description: Evaluates a random set expression, seed 262, number 6792.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06792 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<(CHOOSE b10418 \in {1} : TRUE), (<<5, 6>>)[2147483647]>>, ((--1) * Cardinality(1..3))) .. LET b10419 == IF (<<1, 2>> = (1 :> 2)) THEN IF TRUE THEN 0 ELSE TRUE ELSE (2147483647 % 1) IN (CHOOSE b10420 \in UNION {{x \in 1..3 : x > 1}, 1..3} : (<<>> = FALSE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 88 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | ExtendableExpr starting at line 14, column 84.
    | Expression starting at line 14, column 84.
    | Optional Arguments starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_06792
    | In module random_06792
    | Could not parse module random_06792 from file random_06792.tla
    | *** Errors: 1
    | In module random_06792
    | Could not parse module random_06792 from file random_06792.tla
    3002:1 Parsing or semantic analysis failed.
---*)
