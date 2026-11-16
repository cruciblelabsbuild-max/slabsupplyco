export default function GradedCardImage({ image, name, grade, grader, eager = false }: { image: string; name: string; grade: string; grader: string; eager?: boolean }) {
  return <div className="selection-slab" data-grader={grader}>
    <div className="selection-slab-label"><span>{name}</span><strong>{grade}</strong><small>GRADED POKÉMON</small></div>
    <img src={image} alt={`${name}, ${grade}`} width={600} height={825} loading={eager ? "eager" : "lazy"} />
  </div>;
}
