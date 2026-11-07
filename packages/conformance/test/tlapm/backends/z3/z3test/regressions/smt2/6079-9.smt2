(*---
description: z3test's regression regressions/smt2/6079-9.smt2.
ref: regressions/smt2/6079-9.smt2
features:
  - z3test
outcome: sat
---*)
(set-option :print-success false)
(set-option :rewriter.arith_lhs true)
; (set-option :smt.bv.eq_axioms false) ;; option has been removed and it was never set to false internally.
(set-option :model_validate true)
(set-logic ALL)
(set-info :status unknown)
(declare-fun SS9MCBOP8C () (_ FloatingPoint 8 24))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x25 (and $x27 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x85 (=> $x15 $x41))) (let (($x63 (or $x85 $x41))) (let (($x117 (or $x14 $x27))) (let (($x60 (or $x117 $x63))) (let (($x62 (or $x60 $x25))) (let (($x69 (=> $x15 $x14))) (let (($x21 (and $x41 $x41))) (let (($x95 (and $x21 $x69))) (let (($x40 (or $x63 $x95))) (let (($x23 (=> (and $x41 $x19) $x14))) (let (($x20 (or $x27 $x25))) (let (($x18 (=> $x27 $x20))) (let (($x78 (=> (and $x18 $x41 $x19) $x14))) (let (($x16 (and $x78 $x40))) (or $x16 $x62))))))))))))))))))))))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x85 (=> $x15 $x41))) (let (($x63 (or $x85 $x41))) (let (($x94 (and $x14 $x85))) (=> $x94 $x63))))))))))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x23 (=> (and $x41 $x19) $x14))) (let (($x69 (=> $x15 $x14))) (let (($x21 (and $x41 $x41))) (let (($x95 (and $x21 $x69))) (let (($x85 (=> $x15 $x41))) (let (($x63 (or $x85 $x41))) (let (($x40 (or $x63 $x95))) (let (($x25 (and $x27 $x14))) (let (($x20 (or $x27 $x25))) (let (($x18 (=> $x27 $x20))) (let (($x78 (=> (and $x18 $x41 $x19) $x14))) (let (($x16 (and $x78 $x40))) (=> (and $x16 $x41 $x19) $x14)))))))))))))))))))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x25 (and $x27 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x85 (=> $x15 $x41))) (let (($x63 (or $x85 $x41))) (let (($x117 (or $x14 $x27))) (let (($x60 (or $x117 $x63))) (let (($x62 (or $x60 $x25))) (let (($x23 (=> (and $x41 $x19) $x14))) (or $x23 $x62))))))))))))))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x85 (=> $x15 $x41))) (let (($x25 (and $x27 $x14))) (let (($x20 (or $x27 $x25))) (let (($x59 (=> $x20 $x20))) (let (($x87 (=> (and $x14 $x20) $x20))) (let (($x83 (and $x41 $x87))) (let (($x86 (=> $x20 $x83))) (or $x86 $x85))))))))))))))
(assert (let (($x14 (and (distinct (ite (fp.gt SS9MCBOP8C (fp (_ bv0 1) (_ bv134 8) (_ bv3407872 23))) (_ bv1 32) (_ bv0 32)) (_ bv0 32)) true))) (let (($x27 (=> $x14 $x14))) (let (($x41 (or $x27 $x27))) (let (($x19 (and $x27 $x41))) (let (($x15 (=> $x19 $x14))) (let (($x85 (=> $x15 $x41))) (let (($x94 (and $x14 $x85))) (let (($x21 (and $x41 $x41))) (let (($x73 (=> $x21 $x94))) (let (($x23 (=> (and $x41 $x19) $x14))) (or $x23 $x73))))))))))))
(check-sat-using (then bit-blast smt))

(*--- recorded
all:
  exit: 0
  transcript: sat
---*)
