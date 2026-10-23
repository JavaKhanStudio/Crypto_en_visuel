"""r613: a cheaper soft shadow filter to measure and shoot against three's PCFSoft (tools/scene_cost.py --bilinear,
tools/shadow_filter_shots.py --types ...,Bilinear). Evaluated in the page before any PCF program is compiled."""

# r613 prototype: 'Bilinear' is the PCF branch of getShadow rewritten as one bilinear 2x2 compare (4 fetches,
# PCFSoft's 16), so it compiles as type PCF; the patch goes in before any PCF program exists
BILINEAR = r"""async () => {
  const THREE = await import('three'), K = 'shadowmap_pars_fragment', src = THREE.ShaderChunk[K];
  const a = src.indexOf('#if defined( SHADOWMAP_TYPE_PCF )'), b = src.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )', a);
  THREE.ShaderChunk[K] = src.slice(0, a) + `#if defined( SHADOWMAP_TYPE_PCF )
    vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
    vec2 st = shadowCoord.xy * shadowMapSize - 0.5, f = fract( st ), uv = ( floor( st ) + 0.5 ) * texelSize;
    shadow = mix( mix( texture2DCompare( shadowMap, uv, shadowCoord.z ), texture2DCompare( shadowMap, uv + vec2( texelSize.x, 0.0 ), shadowCoord.z ), f.x ),
      mix( texture2DCompare( shadowMap, uv + vec2( 0.0, texelSize.y ), shadowCoord.z ), texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ), f.x ), f.y );
  ` + src.slice(b);
  return a >= 0 && b > a;
}"""
