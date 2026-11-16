(*---
description: z3test's regression regressions/smt2/2431.smt2.
ref: regressions/smt2/2431.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :produce-models true)
(set-option :produce-unsat-cores true)

(set-logic ALL)

(declare-datatypes () ((list_Int (list.int (list.int.seq (Seq Int)) (list.int.content (Array (Seq Int) Int))))))

(declare-const list.int.empty list_Int)
(assert (= list.int.empty (list.int (as seq.empty (Seq Int)) ((as const (Array (Seq Int) Int)) -12345))))

(define-fun list.int.at ((l list_Int) (i Int)) Int (select (list.int.content l) (seq.at (list.int.seq l) i)))
(define-fun list.int.size ((l list_Int)) Int (seq.len (list.int.seq l)))

(declare-const res list_Int)

(assert
    (! 
        (not (=> (and (> (list.int.size res) 0)) (and (exists ((index Int) ) (and (>= index 0) (< index (list.int.size res)) (< (list.int.at res index) 5))))))
    :named gen-0)
)

(check-sat)
;OUT: unknown

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
