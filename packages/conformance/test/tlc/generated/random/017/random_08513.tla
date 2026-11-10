(*---
description: Evaluates a random int expression, seed 262, number 8513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<5, 6>> EXCEPT ![3] = 0] EXCEPT ![(-2)] = Cardinality({2, 1, 3})] @@ [(CHOOSE f \in [{} -> {2, 1, 3}] : TRUE) EXCEPT ![((1 :> 2))[0]] = CASE FALSE -> 2 [] OTHER -> -1]))[((CHOOSE b13190 \in (SUBSET {1} \cup {1, 2}) : (FALSE <=> FALSE)) \div ((1 * -1) + (3 + -1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 266 to line 14, col 266 of module random_08513 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 264.
    | Expression starting at line 14, column 264.
    | ExtendableExpr starting at line 14, column 263.
    | Expression starting at line 14, column 263.
    | ExtendableExpr starting at line 14, column 262.
    | Fatal errors while parsing TLA+ spec in file random_08513
    | In module random_08513
    | Could not parse module random_08513 from file random_08513.tla
    | *** Errors: 1
    | In module random_08513
    | Could not parse module random_08513 from file random_08513.tla
    3002:1 Parsing or semantic analysis failed.
---*)
