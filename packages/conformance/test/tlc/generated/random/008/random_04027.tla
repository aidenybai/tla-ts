(*---
description: Evaluates a random seq expression, seed 262, number 4027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SubSeq([<<1, 2>> EXCEPT ![1] = 2147483647], (7 \div -1), (CHOOSE b6326 \in {} : FALSE)), LAMBDA p, q : p < q), (CHOOSE b6327 \in [b6328 \in UNION {SUBSET {1}, Nat} |-> Len(<<1>>)] : ({b6329 : b6329 \in {2, 1, 3}} \subseteq DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 78 to line 14, col 81 of module random_04027 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Optional Arguments starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_04027
    | In module random_04027
    | Could not parse module random_04027 from file random_04027.tla
    | *** Errors: 1
    | In module random_04027
    | Could not parse module random_04027 from file random_04027.tla
    3002:1 Parsing or semantic analysis failed.
---*)
