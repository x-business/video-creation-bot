# Vercel Deployment Troubleshooting

## "This site can't be reached" Error

This error typically means:
1. **Deployment failed** - Check Vercel dashboard for build errors
2. **Build output missing** - Verify `dist/public` contains files after build
3. **Routing misconfiguration** - Check `vercel.json` configuration

## Quick Checks

### 1. Check Build Logs
- Go to Vercel Dashboard → Your Project → Deployments
- Click on the latest deployment
- Check the "Build Logs" tab for errors

### 2. Verify Build Output
The build should create:
- `dist/public/index.html`
- `dist/public/assets/*.js` (JavaScript bundles)
- `dist/public/assets/*.css` (CSS files, if any)

### 3. Check Function Logs
- Go to Vercel Dashboard → Your Project → Functions
- Check for any runtime errors in `/api/index`

### 4. Test API Endpoint
Try accessing: `https://your-domain.vercel.app/api/projects`
- If this works, the API is functioning
- If this fails, check the function logs

## Common Issues

### Issue 1: Build Fails
**Symptoms**: Build logs show errors
**Solution**: 
- Check that all dependencies are in `package.json`
- Verify `npm run build` works locally
- Check for TypeScript errors

### Issue 2: Static Files Not Found
**Symptoms**: Blank page, 404 errors for assets
**Solution**:
- Verify `outputDirectory` in `vercel.json` matches build output
- Check that `dist/public` exists after build
- Ensure `index.html` is in the output directory

### Issue 3: API Routes Not Working
**Symptoms**: API calls return 500 or timeout
**Solution**:
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Check that `api/index.ts` is exporting correctly

### Issue 4: Initialization Errors
**Symptoms**: Function times out or crashes
**Solution**:
- Check that database/storage is properly configured
- Verify all imports are correct
- Check for async initialization issues

## Debugging Steps

1. **Check Deployment Status**
   ```bash
   vercel ls
   ```

2. **View Function Logs**
   - Vercel Dashboard → Project → Functions → View Logs

3. **Test Locally First**
   ```bash
   npm run build
   npm start
   ```
   Verify it works locally before deploying

4. **Check Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set

5. **Simplify Configuration**
   - Remove unnecessary rewrites
   - Test with minimal `vercel.json`

## Next Steps

If the site still can't be reached:
1. Check Vercel dashboard for deployment status
2. Review build logs for errors
3. Check function logs for runtime errors
4. Verify the domain is correctly configured
5. Try accessing the raw deployment URL from Vercel dashboard
